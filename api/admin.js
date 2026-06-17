// ============================================
// DOKITA ADMIN API — api/admin.js
// VERSION : V1.3 — 2026-05-21
// Auth    : x-admin-token vérifié contre env ADMIN_PWD
// ============================================
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
      .from('pharmacies').select('id, nom, ville, telephone')
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

  return res.status(404).json({ error: 'Route introuvable' });
}
