// ============================================
// DOKITA ADMIN API — api/admin.js
// VERSION : V1.4 — 2026-07-04
// AJOUT   : GET action=facturation&mois=YYYY-MM — facturation partenaires unifiée
//           (modèle "redevance forfaitaire par acte", décision GQ session 16) :
//           pharmacies = 5% des AO livrés du mois ; médecins = forfait par
//           consultation aboutie + forfait par consultation avec lecture de
//           résultats d'examens (dérivée : ≥1 examen avec resultat non nul).
//           Montants HT — TVA 18% facturée en sus (décision GQ).
// DÉSACT. : POST relancer_payout neutralisé (early return 410, code intact) —
//           c'était le dernier chemin capable de déclencher un vrai virement
//           Flutterwave pendant le test du modèle comptoir.
// NOTE    : quand les gates de paiement patient seront réactivés, l'assiette
//           médecin devra basculer sur la table paiements (actes ENCAISSÉS).
// VERSION : V1.3 — 2026-05-21
// Auth    : x-admin-token vérifié contre env ADMIN_PWD
// ============================================

// ── PARAMÈTRES DE FACTURATION PARTENAIRES (ajustables — décision GQ session 16) ──
const TARIF_ACTE_CONSULTATION_HT = 1000; // FCFA HT par téléconsultation aboutie (≈20% de 5000)
const TARIF_LECTURE_EXAMENS_HT   = 1000; // FCFA HT par consultation avec lecture de résultats
const COMMISSION_PHARMACIE_PCT   = 5;    // % du total_fcfa des AO livrés du mois
const TVA_PCT                    = 18;   // TVA CI — en sus des montants HT
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Auth — token comparé à la variable d'env (jamais exposée côté client)
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_PWD) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const action = req.query.action;

  // Route ping — juste vérifier que le token est valide
  if (req.method === 'GET' && action === 'ping') {
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'GET' && action === 'pharmacies') {
    // Table 'pharmacies' en dev — à migrer vers 'etablissements' avant go-live
    const { data, error } = await supabase
      .from('pharmacies').select('id, nom, ville, telephone, mobile_money_numero, mobile_money_operateur')
      .order('nom').limit(200);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  if (req.method === 'GET' && action === 'reconciliation') {
    const { data, error } = await supabase
      .from('vw_reconciliation_stock').select('*')
      .order('pct_hors_dokita', { ascending: false, nullsFirst: false }).limit(200);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  if (req.method === 'GET' && action === 'historique') {
    const { data, error } = await supabase
      .from('stock_pharmacie').select('*')
      .order('created_at', { ascending: false }).limit(200);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  if (req.method === 'POST' && action === 'stock') {
    const b = req.body;
    if (!b?.pharmacie_id || !b?.medicament)
      return res.status(400).json({ error: 'pharmacie_id et medicament requis' });
    const { error } = await supabase.from('stock_pharmacie').insert([{
      pharmacie_id:         b.pharmacie_id,
      pharmacie_nom:        b.pharmacie_nom || null,
      medicament:           b.medicament,
      quantite_recue:       b.quantite_recue || 0,
      quantite_reservee:    0,
      quantite_restante:    null,
      prix_unitaire_dokita: b.prix_unitaire_dokita || null,
      date_livraison:       b.date_livraison || null,
      date_declaration:     new Date().toISOString().split('T')[0],
      bon_livraison_ref:    b.bon_livraison_ref || null
    }]);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ ok: true });
  }

  // PATCH pharmacie — mobile money
  if (req.method === 'PATCH' && action === 'pharmacie') {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'id requis' });
    const { mobile_money_operateur, mobile_money_numero } = req.body || {};
    if (!mobile_money_operateur || !mobile_money_numero) {
      return res.status(400).json({ error: 'operateur et numero requis' });
    }
    const { error } = await supabase.from('pharmacies')
      .update({ mobile_money_operateur, mobile_money_numero, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  // GET payouts_ko — AO livrés dont le payout pharmacie n'a pas réussi
  // Cas couverts : payout_statut='echec' (Flutterwave a refusé le transfert),
  // ou statut='livre' alors que payout_statut est resté à 'en_attente' (le payout
  // n'a jamais été déclenché — typiquement mobile_money manquant côté pharmacie,
  // cf. warning "Payout pharmacie non déclenché" dans les logs api/pharmacie).
  // GET ?action=facturation&mois=YYYY-MM — facturation partenaires du mois
  if (req.method === 'GET' && action === 'facturation') {
    const mois = String(req.query.mois || '').trim();
    if (!/^\d{4}-\d{2}$/.test(mois)) return res.status(400).json({ error: 'mois requis (format YYYY-MM)' });
    const debut = mois + '-01';
    const [yy, mm] = mois.split('-').map(Number);
    const fin = new Date(Date.UTC(mm === 12 ? yy + 1 : yy, mm === 12 ? 0 : mm, 1))
      .toISOString().split('T')[0]; // 1er jour du mois suivant (borne exclusive)

    // 1) PHARMACIES — AO livrés dans le mois (fenêtre livraison_at)
    const { data: aos, error: e1 } = await supabase
      .from('appels_offres')
      .select('id, pharmacie_id, pharmacie_nom, total_fcfa, livraison_at')
      .eq('statut', 'livre')
      .gte('livraison_at', debut).lt('livraison_at', fin)
      .order('livraison_at', { ascending: true })
      .limit(1000);
    if (e1) return res.status(500).json({ error: 'appels_offres: ' + e1.message });
    const phMap = {};
    (aos || []).forEach(ao => {
      const k = ao.pharmacie_id || ao.pharmacie_nom || 'inconnu';
      if (!phMap[k]) phMap[k] = { pharmacie_id: ao.pharmacie_id || null,
        pharmacie_nom: ao.pharmacie_nom || 'Pharmacie inconnue', nb_ao: 0, total_vendu_fcfa: 0, actes: [] };
      const montant = parseFloat(ao.total_fcfa) || 0;
      phMap[k].nb_ao++;
      phMap[k].total_vendu_fcfa += montant;
      phMap[k].actes.push({ id: ao.id, date: ao.livraison_at, montant });
    });
    const pharmacies = Object.values(phMap).map(p => {
      const ht = Math.round(p.total_vendu_fcfa * COMMISSION_PHARMACIE_PCT / 100);
      const tva = Math.round(ht * TVA_PCT / 100);
      return Object.assign(p, { commission_pct: COMMISSION_PHARMACIE_PCT,
        redevance_ht: ht, tva, ttc: ht + tva });
    });

    // 2) MÉDECINS — 1 acte = 1 consultation distincte avec ordonnance envoyée dans le mois
    const { data: ords, error: e2 } = await supabase
      .from('ordonnances')
      .select('consultation_id, medecin_id, validee_at')
      .eq('statut', 'envoyee_patient')
      .gte('validee_at', debut).lt('validee_at', fin)
      .order('validee_at', { ascending: true })
      .limit(2000);
    if (e2) return res.status(500).json({ error: 'ordonnances: ' + e2.message });
    const medMap = {}; const vus = new Set();
    (ords || []).forEach(o => {
      if (!o.medecin_id || !o.consultation_id) return;
      const key = o.medecin_id + '|' + o.consultation_id;
      if (vus.has(key)) return; // dédoublonnage re-validations d'une même consultation
      vus.add(key);
      if (!medMap[o.medecin_id]) medMap[o.medecin_id] = { medecin_id: o.medecin_id, consultations: [] };
      medMap[o.medecin_id].consultations.push({ consultation_id: o.consultation_id,
        date: o.validee_at, lecture_examens: false });
    });

    // 3) Lectures d'examens — dérivée : consultation facturée dont ≥1 examen a un resultat.
    //    select('*') volontaire + filtre en JS : aucune hypothèse de colonne (pattern naiss).
    const consultIds = [...new Set([...vus].map(k => k.split('|')[1]))];
    if (consultIds.length) {
      const { data: exams, error: e3 } = await supabase
        .from('examens').select('*').in('consultation_id', consultIds).limit(5000);
      if (e3) return res.status(500).json({ error: 'examens: ' + e3.message });
      const avecResultat = new Set((exams || [])
        .filter(x => x && x.resultat !== null && x.resultat !== undefined && x.resultat !== '')
        .map(x => x.consultation_id));
      Object.values(medMap).forEach(m => m.consultations.forEach(c => {
        if (avecResultat.has(c.consultation_id)) c.lecture_examens = true;
      }));
    }

    // 4) Identité médecins — select('*') + lecture défensive (aucune colonne supposée)
    const medIds = Object.keys(medMap);
    let medRows = [];
    if (medIds.length) {
      const { data: ms, error: e4 } = await supabase
        .from('medecins').select('*').in('id', medIds);
      if (e4) return res.status(500).json({ error: 'medecins: ' + e4.message });
      medRows = ms || [];
    }
    const medecins = Object.values(medMap).map(m => {
      const info = medRows.find(r => r.id === m.medecin_id) || {};
      const nbC = m.consultations.length;
      const nbL = m.consultations.filter(c => c.lecture_examens).length;
      const ht = nbC * TARIF_ACTE_CONSULTATION_HT + nbL * TARIF_LECTURE_EXAMENS_HT;
      const tva = Math.round(ht * TVA_PCT / 100);
      return {
        medecin_id: m.medecin_id,
        nom: info.nom_complet || info.nom || ('Médecin ' + String(m.medecin_id).slice(0, 8)),
        email: info.email || '',
        nb_consultations: nbC, nb_lectures_examens: nbL,
        tarif_consultation_ht: TARIF_ACTE_CONSULTATION_HT,
        tarif_lecture_ht: TARIF_LECTURE_EXAMENS_HT,
        redevance_ht: ht, tva, ttc: ht + tva,
        actes: m.consultations
      };
    });

    return res.status(200).json({ mois, tva_pct: TVA_PCT, pharmacies, medecins });
  }

  if (req.method === 'GET' && action === 'payouts_ko') {
    const { data, error } = await supabase
      .from('appels_offres')
      .select('id, pharmacie_id, pharmacie_nom, total_fcfa, statut, payout_statut, livraison_at, updated_at')
      .eq('statut', 'livre')
      .or('payout_statut.eq.echec,payout_statut.eq.en_attente,payout_statut.is.null')
      .order('updated_at', { ascending: false })
      .limit(200);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  // POST relancer_payout — rejoue le payout pharmacie pour un AO déjà livré,
  // sans repasser par tout le flux patient. Relit les données fraîches (utile
  // si le mobile money de la pharmacie vient d'être corrigé via PATCH pharmacie)
  // puis rappelle payment.js?action=payout_pharmacie, exactement comme le ferait
  // pharmacie.js automatiquement après confirmerLivraison().
  if (req.method === 'POST' && action === 'relancer_payout') {
    // ── DÉSACTIVÉ V1.4 (modèle "paiement au comptoir" en test) ──────────────
    // Ce return neutralise la relance de virement Flutterwave sans toucher au
    // code ci-dessous (intact, réactivable en supprimant ces 3 lignes).
    return res.status(410).json({ error: 'Relance payout désactivée — modèle comptoir en test. Utiliser l\'onglet Facturation.' });
    // ─────────────────────────────────────────────────────────────────────────
    const appelOffreId = req.body?.appel_offre_id;
    if (!appelOffreId) return res.status(400).json({ error: 'appel_offre_id requis' });

    const { data: ao, error: aoErr } = await supabase
      .from('appels_offres')
      .select('id, pharmacie_id, pharmacie_nom, total_fcfa, statut')
      .eq('id', appelOffreId).single();
    if (aoErr || !ao) return res.status(404).json({ error: 'AO introuvable' });
    if (ao.statut !== 'livre') {
      return res.status(400).json({ error: 'AO pas au statut livre — payout non applicable' });
    }
    if (!ao.total_fcfa || !ao.pharmacie_id) {
      return res.status(400).json({ error: 'total_fcfa ou pharmacie_id manquant sur cet AO' });
    }

    const { data: pharma, error: phErr } = await supabase
      .from('pharmacies')
      .select('mobile_money_numero, mobile_money_operateur')
      .eq('id', ao.pharmacie_id).single();
    if (phErr || !pharma?.mobile_money_numero) {
      return res.status(400).json({ error: 'Mobile money pharmacie manquant — corriger via l\'onglet Pharmacies avant de relancer' });
    }

    try {
      const payoutRes = await fetch(
        (process.env.BASE_URL || 'https://heydoc-mu.vercel.app') + '/api/payment?action=payout_pharmacie',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-payout-secret': process.env.PAYOUT_SECRET || ''
          },
          body: JSON.stringify({
            appel_offre_id:         ao.id,
            pharmacie_id:           ao.pharmacie_id,
            pharmacie_nom:          ao.pharmacie_nom || '',
            montant_total:          ao.total_fcfa,
            mobile_money_numero:    pharma.mobile_money_numero,
            mobile_money_operateur: pharma.mobile_money_operateur || ''
          })
        }
      );
      const payoutData = await payoutRes.json();
      if (!payoutData.ok) {
        return res.status(400).json({ error: payoutData.error || 'Payout toujours en échec', details: payoutData });
      }
      return res.status(200).json({ ok: true, ...payoutData });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(404).json({ error: 'Route introuvable' });
}
