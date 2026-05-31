// ============================================
// DOKITA CINETPAY API — api/cinetpay.js
// VERSION : V1.0
// DATE    : 2026-05-31
// Checkout CinetPay — paiement consultation 5 000 FCFA
// Endpoints CinetPay :
//   POST https://api-checkout.cinetpay.com/v2/payment        (init)
//   POST https://api-checkout.cinetpay.com/v2/payment/check  (vérif)
// ============================================

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const APIKEY  = process.env.CINETPAY_API_KEY;
const SITE_ID = process.env.CINETPAY_SITE_ID;
const BASE_URL = 'https://heydoc-mu.vercel.app';
const CP_URL   = 'https://api-checkout.cinetpay.com/v2/payment';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action;

  // ══════════════════════════════════════════════
  // ACTION : initier — créer une transaction CinetPay
  // Appelé depuis index.html avant la consultation
  // ══════════════════════════════════════════════
  if (req.method === 'POST' && action === 'initier') {
    // Auth JWT requis
    const auth = req.headers['authorization'] || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Non autorisé' });

    const { patient_id, patient_nom, patient_prenom, patient_email, patient_tel, consultation_id } = req.body || {};
    if (!patient_id) return res.status(400).json({ error: 'patient_id requis' });

    if (!APIKEY || !SITE_ID) return res.status(500).json({ error: 'Clés CinetPay manquantes' });

    // Générer un transaction_id unique
    const transaction_id = 'DKT-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const payload = {
      apikey:      APIKEY,
      site_id:     SITE_ID,
      transaction_id,
      amount:      5000,
      currency:    'XOF',
      description: 'Consultation médicale Dokita',
      return_url:  BASE_URL + '/api/cinetpay?action=retour&txn=' + transaction_id,
      notify_url:  BASE_URL + '/api/cinetpay?action=notify',
      channels:    'ALL',
      lang:        'FR',
      metadata:    JSON.stringify({ patient_id, consultation_id: consultation_id || '' }),
      customer_id:           patient_id,
      customer_name:         patient_nom    || 'Patient',
      customer_surname:      patient_prenom || 'Dokita',
      customer_email:        patient_email  || 'patient@dokita.ci',
      customer_phone_number: patient_tel    || '',
      customer_address:      '',
      customer_city:         '',
      customer_country:      'CI',
      customer_state:        'CI',
      customer_zip_code:     ''
    };

    try {
      const r = await fetch(CP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await r.json();

      if (data.code !== '201') {
        return res.status(400).json({ error: data.description || data.message, code: data.code });
      }

      // Sauvegarder la transaction en attente dans Supabase
      await supabase.from('paiements').insert([{
        transaction_id,
        patient_id,
        consultation_id:  consultation_id || null,
        montant:          5000,
        devise:           'XOF',
        statut:           'en_attente',
        payment_token:    data.data.payment_token,
        payment_url:      data.data.payment_url,
        created_at:       new Date().toISOString()
      }]);

      return res.status(200).json({
        transaction_id,
        payment_url:   data.data.payment_url,
        payment_token: data.data.payment_token
      });

    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ══════════════════════════════════════════════
  // ACTION : notify — webhook CinetPay (POST)
  // CinetPay appelle cette URL après chaque paiement
  // ══════════════════════════════════════════════
  if (action === 'notify') {
    const cpm_trans_id = req.body?.cpm_trans_id || req.query?.cpm_trans_id;
    const cpm_site_id  = req.body?.cpm_site_id  || req.query?.cpm_site_id;

    if (!cpm_trans_id) return res.status(400).json({ error: 'cpm_trans_id manquant' });

    // Vérifier la transaction auprès de CinetPay (ne jamais faire confiance au POST seul)
    try {
      const verif = await fetch(CP_URL + '/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey:         APIKEY,
          site_id:        SITE_ID,
          transaction_id: cpm_trans_id
        })
      });
      const vdata = await verif.json();

      const statut_cp = vdata.data?.status || 'REFUSED';
      const statut_dokita = statut_cp === 'ACCEPTED' ? 'paye' :
                            statut_cp === 'WAITING_FOR_CUSTOMER' ? 'en_attente' : 'echec';

      // Mettre à jour la table paiements
      await supabase.from('paiements')
        .update({
          statut:          statut_dokita,
          statut_cinetpay: statut_cp,
          operateur:       vdata.data?.payment_method || null,
          updated_at:      new Date().toISOString()
        })
        .eq('transaction_id', cpm_trans_id);

      // Si paiement accepté → débloquer la consultation
      if (statut_dokita === 'paye') {
        const { data: paiement } = await supabase
          .from('paiements').select('consultation_id, patient_id')
          .eq('transaction_id', cpm_trans_id).single();

        if (paiement?.consultation_id) {
          await supabase.from('consultations')
            .update({ paiement_statut: 'paye', updated_at: new Date().toISOString() })
            .eq('id', paiement.consultation_id);
        }
      }

      return res.status(200).json({ ok: true, statut: statut_dokita });

    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ══════════════════════════════════════════════
  // ACTION : verifier — vérifier statut depuis le front
  // Appelé par index.html après retour de la page CinetPay
  // ══════════════════════════════════════════════
  if (req.method === 'GET' && action === 'verifier') {
    const auth = req.headers['authorization'] || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Non autorisé' });

    const transaction_id = req.query.txn;
    if (!transaction_id) return res.status(400).json({ error: 'txn requis' });

    const { data, error } = await supabase
      .from('paiements').select('*')
      .eq('transaction_id', transaction_id).single();

    if (error || !data) return res.status(404).json({ error: 'Transaction introuvable' });
    return res.status(200).json({ statut: data.statut, montant: data.montant, operateur: data.operateur });
  }

  // ══════════════════════════════════════════════
  // ACTION : retour — page de retour après paiement
  // CinetPay redirige ici après la page de paiement
  // ══════════════════════════════════════════════
  if (action === 'retour') {
    const txn = req.query.txn || '';
    // Rediriger vers l'app patient avec le txn en paramètre
    // L'app vérifiera le statut via action=verifier
    return res.redirect(302, BASE_URL + '/?paiement=' + txn);
  }

  return res.status(404).json({ error: 'Action inconnue : ' + action });
}
