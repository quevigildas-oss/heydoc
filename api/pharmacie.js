// api/pharmacie.js
// Endpoints pharmacie — authentification par token AO (ao_id dans l'URL)
// VERSION : V1.2
// ADD     : whitelist prix_unitaire, quantite_boites, total_fcfa, medicaments_offre, disponible_totalite
// DATE    : 2026-05-19
// NOTES   : Pas de JWT — la pharmacie s'authentifie via l'ao_id unique dans le lien WhatsApp
//           Utilise service_role (via _lib/supabase.js) pour bypasser RLS
//           Accès limité : appels_offres (lecture + PATCH) + stock_pharmacie (lecture + PATCH)

const supabase = require('./_lib/supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  try {

    // ── GET /api/pharmacie?action=ao&ao_id=xxx ─────────────────────────────
    // Charge l'AO par ao_id (token unique dans le lien WhatsApp)
    if (req.method === 'GET' && action === 'ao') {
      const aoId = req.query.ao_id;
      if (!aoId) return res.status(400).json({ error: 'ao_id requis' });

      const { data, error } = await supabase
        .from('appels_offres')
        .select('*')
        .eq('ao_id', aoId)
        .limit(1);

      if (error) return res.status(500).json({ error: error.message });
      if (!data || !data.length) return res.status(404).json({ error: 'AO introuvable ou expiré' });
      return res.status(200).json(data[0]);
    }

    // ── PATCH /api/pharmacie?action=ao&id=xxx ─────────────────────────────
    // Met à jour un AO (statut, code_retrait, raison_indisponibilite...)
    // Sécurité : vérifie que l'AO existe avant PATCH
    if (req.method === 'PATCH' && action === 'ao') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id requis' });

      // Vérifier que l'AO existe
      const { data: check } = await supabase
        .from('appels_offres').select('id').eq('id', id).limit(1);
      if (!check || !check.length) return res.status(404).json({ error: 'AO introuvable' });

      const allowed = [
        'statut', 'date_reponse', 'date_validation',
        'raison_indisponibilite', 'alerte_stock', 'code_retrait',
        'disponible_totalite', 'prix_unitaire', 'quantite_boites',
        'quantite_comprimes', 'total_fcfa', 'medicaments_offre'
      ];
      const safe = {};
      allowed.forEach(k => { if (req.body[k] !== undefined) safe[k] = req.body[k]; });

      const { error } = await supabase.from('appels_offres').update(safe).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });

      // Si statut=livre → déclencher payout pharmacie côté serveur
      if (safe.statut === 'livre') {
        try {
          // Recharger l'AO complet pour avoir les infos payout
          const { data: ao } = await supabase
            .from('appels_offres')
            .select('ao_id, pharmacie_id, pharmacie_nom, total_fcfa')
            .eq('id', id).single();

          // Charger le mobile money de la pharmacie
          const { data: pharma } = await supabase
            .from('pharmacies')
            .select('mobile_money_numero, mobile_money_operateur')
            .eq('id', ao?.pharmacie_id || '').single();

          if (ao?.total_fcfa && pharma?.mobile_money_numero) {
            // Appel interne à api/payment — service-to-service avec PAYOUT_SECRET
            const payoutRes = await fetch(
              (process.env.BASE_URL || 'https://heydoc-mu.vercel.app') + '/api/payment?action=payout_pharmacie',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-payout-secret': process.env.PAYOUT_SECRET || ''
                },
                body: JSON.stringify({
                  ao_id:                  ao.ao_id || id,
                  pharmacie_id:           ao.pharmacie_id || '',
                  pharmacie_nom:          ao.pharmacie_nom || '',
                  montant_total:          ao.total_fcfa,
                  mobile_money_numero:    pharma.mobile_money_numero,
                  mobile_money_operateur: pharma.mobile_money_operateur || ''
                })
              }
            );
            const payoutData = await payoutRes.json();
            if (!payoutData.ok) {
              console.error('Payout pharmacie echec:', payoutData.error);
            }
          }
        } catch (payErr) {
          console.error('Payout pharmacie err:', payErr.message);
          // Ne pas bloquer la réponse — le PATCH est fait, le payout sera retenté manuellement
        }
      }

      return res.status(200).json({ ok: true });
    }

    // ── PATCH /api/pharmacie?action=ao_annuler_autres ─────────────────────
    // Annule les autres AO de la même consultation (après validation retrait)
    if (req.method === 'PATCH' && action === 'ao_annuler_autres') {
      const { consultation_id, exclude_id } = req.body;
      if (!consultation_id) return res.status(400).json({ error: 'consultation_id requis' });

      const { data: autres } = await supabase
        .from('appels_offres')
        .select('id')
        .eq('consultation_id', consultation_id)
        .neq('id', exclude_id || '')
        .neq('statut', 'livre');

      if (autres && autres.length) {
        await Promise.all(autres.map(r =>
          supabase.from('appels_offres').update({ statut: 'annule' }).eq('id', r.id)
        ));
      }
      return res.status(200).json({ ok: true, annules: (autres || []).length });
    }

    // ── GET /api/pharmacie?action=stock&pharmacie_nom=xxx&medicament=xxx ──
    // Charge le stock d'un médicament pour une pharmacie
    if (req.method === 'GET' && action === 'stock') {
      const { pharmacie_nom, medicament } = req.query;
      if (!pharmacie_nom || !medicament) return res.status(400).json({ error: 'pharmacie_nom et medicament requis' });

      const motCle = medicament.split(' ')[0]; // premier mot du nom
      const { data, error } = await supabase
        .from('stock_pharmacie')
        .select('id, quantite_recue, quantite_reservee')
        .eq('pharmacie_nom', pharmacie_nom)
        .ilike('medicament', `%${motCle}%`)
        .limit(1);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data && data.length ? data[0] : null);
    }

    // ── PATCH /api/pharmacie?action=stock&id=xxx ─────────────────────────
    // Met à jour le stock (quantite_reservee) après retrait
    if (req.method === 'PATCH' && action === 'stock') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id requis' });

      const allowed = ['quantite_reservee', 'alerte_stock', 'updated_at'];
      const safe = {};
      allowed.forEach(k => { if (req.body[k] !== undefined) safe[k] = req.body[k]; });

      const { error } = await supabase.from('stock_pharmacie').update(safe).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(404).json({ error: 'Action non reconnue: ' + action });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
