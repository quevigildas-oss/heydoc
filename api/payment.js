// ============================================
// DOKITA PAYMENT API — api/payment.js
// VERSION : V1.1
// DATE    : 2026-06-01
// Provider : Flutterwave (remplace CinetPay)
// Docs     : https://developer.flutterwave.com
// ============================================

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FLW_SECRET = process.env.FLW_SECRET_KEY;  // FLWSECK_TEST-xxx ou FLWSECK-xxx (prod)
const BASE_URL   = process.env.BASE_URL || 'https://heydoc-mu.vercel.app';
const FLW_BASE   = 'https://api.flutterwave.com/v3';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action;

  // ══════════════════════════════════════════════
  // ACTION : initier — créer une transaction Flutterwave
  // ══════════════════════════════════════════════
  if (req.method === 'POST' && action === 'initier') {
    const auth = req.headers['authorization'] || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Non autorisé' });

    if (!FLW_SECRET) return res.status(500).json({ error: 'Clé Flutterwave manquante' });

    const {
      patient_id, patient_nom, patient_prenom,
      patient_email, patient_tel,
      consultation_id, type_paiement
    } = req.body || {};

    if (!patient_id) return res.status(400).json({ error: 'patient_id requis' });

    const tx_ref = 'DKT-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const payload = {
      tx_ref,
      amount:       5000,
      currency:     'XOF',
      redirect_url: `${BASE_URL}/api/payment?action=retour&txn=${tx_ref}`,
      customer: {
        email:        patient_email || 'patient@dokita.ci',
        phonenumber:  patient_tel   || '',
        name:         `${patient_prenom || ''} ${patient_nom || ''}`.trim() || 'Patient Dokita'
      },
      customizations: {
        title:       'Dokita — Consultation médicale',
        description: type_paiement === 'examen'
          ? 'Envoi résultats examens — 5 000 FCFA'
          : 'Consultation médicale AfriBot — 5 000 FCFA',
        logo: `${BASE_URL}/logo.png`
      },
      meta: {
        patient_id,
        consultation_id: consultation_id || '',
        type_paiement:   type_paiement   || 'consultation'
      },
      payment_options: 'card,mobilemoney,ussd'
    };

    try {
      const r = await fetch(`${FLW_BASE}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FLW_SECRET}`,
          'Content-Type':  'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await r.json();

      if (data.status !== 'success') {
        return res.status(400).json({ error: data.message || 'Flutterwave error', details: data });
      }

      // Sauvegarder la transaction en base
      await supabase.from('paiements').insert([{
        transaction_id:  tx_ref,
        patient_id,
        consultation_id: consultation_id || null,
        montant:         5000,
        devise:          'XOF',
        statut:          'en_attente',
        payment_url:     data.data.link,
        created_at:      new Date().toISOString()
      }]);

      return res.status(200).json({
        transaction_id: tx_ref,
        payment_url:    data.data.link
      });

    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ══════════════════════════════════════════════
  // ACTION : retour — redirection après paiement Flutterwave
  // ══════════════════════════════════════════════
  if (action === 'retour') {
    const txn    = req.query.txn    || '';
    const status = req.query.status || '';  // successful | failed | cancelled
    const tx_ref = req.query.tx_ref || txn;

    // Vérifier le paiement auprès de Flutterwave (ne jamais faire confiance au redirect seul)
    if (status === 'successful' && req.query.transaction_id) {
      try {
        const verif = await fetch(`${FLW_BASE}/transactions/${req.query.transaction_id}/verify`, {
          headers: { 'Authorization': `Bearer ${FLW_SECRET}` }
        });
        const vdata = await verif.json();

        const statut = (vdata.data?.status === 'successful' && vdata.data?.amount >= 5000)
          ? 'paye' : 'echec';

        await supabase.from('paiements')
          .update({ statut, updated_at: new Date().toISOString() })
          .eq('transaction_id', tx_ref);

        if (statut === 'paye') {
          const { data: p } = await supabase
            .from('paiements').select('consultation_id, patient_id')
            .eq('transaction_id', tx_ref).single();
          if (p?.consultation_id) {
            await supabase.from('consultations')
              .update({ paiement_statut: 'paye', updated_at: new Date().toISOString() })
              .eq('id', p.consultation_id);
          }
        }
      } catch (e) {
        console.error('Verif Flutterwave err:', e.message);
      }
    } else if (status !== 'successful') {
      await supabase.from('paiements')
        .update({ statut: 'echec', updated_at: new Date().toISOString() })
        .eq('transaction_id', tx_ref);
    }

    // Rediriger vers l'app avec le résultat
    return res.redirect(302, `${BASE_URL}/?paiement=${tx_ref}&status=${status}`);
  }

  // ══════════════════════════════════════════════
  // ACTION : verifier — vérifier statut depuis le front
  // ══════════════════════════════════════════════
  if (req.method === 'GET' && action === 'verifier') {
    const auth = req.headers['authorization'] || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Non autorisé' });

    const txn = req.query.txn;
    if (!txn) return res.status(400).json({ error: 'txn requis' });

    const { data, error } = await supabase
      .from('paiements').select('*')
      .eq('transaction_id', txn).single();

    if (error || !data) return res.status(404).json({ error: 'Transaction introuvable' });
    return res.status(200).json({ statut: data.statut, montant: data.montant });
  }

  // ══════════════════════════════════════════════
  // ACTION : webhook — notifications Flutterwave (optionnel)
  // Configurer dans Flutterwave dashboard → Webhooks
  // ══════════════════════════════════════════════
  if (req.method === 'POST' && action === 'webhook') {
    // Vérifier la signature Flutterwave
    const hash = req.headers['verif-hash'];
    if (!hash || hash !== process.env.FLW_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Signature invalide' });
    }

    const { event, data: evtData } = req.body || {};
    if (event === 'charge.completed' && evtData?.status === 'successful') {
      const tx_ref = evtData.tx_ref;
      await supabase.from('paiements')
        .update({ statut: 'paye', updated_at: new Date().toISOString() })
        .eq('transaction_id', tx_ref);
    }
    return res.status(200).json({ ok: true });
  }

  // ══════════════════════════════════════════════
  // ACTION : payout — virer la part médecin
  // ══════════════════════════════════════════════
  if (req.method === 'POST' && action === 'payout') {
    const secret = req.headers['x-payout-secret'];
    if (!secret || secret !== process.env.PAYOUT_SECRET) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { medecin_id, consultation_id, montant_patient, abonnement_type } = req.body || {};
    if (!medecin_id || !consultation_id) {
      return res.status(400).json({ error: 'medecin_id et consultation_id requis' });
    }

    const commission     = abonnement_type === 'premium' ? 0.15 : 0.20;
    const montant_total  = montant_patient || 5000;
    const montant_medecin = Math.round(montant_total * (1 - commission));

    const { data: med } = await supabase
      .from('medecins').select('mobile_money_numero, mobile_money_operateur, prenom, nom')
      .eq('id', medecin_id).single();

    if (!med?.mobile_money_numero) {
      return res.status(400).json({ error: 'Numéro mobile money médecin non renseigné' });
    }

    const payout_ref = 'PAYOUT-' + consultation_id.slice(0, 8).toUpperCase() + '-' + Date.now();

    try {
      const r = await fetch(`${FLW_BASE}/transfers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FLW_SECRET}`,
          'Content-Type':  'application/json'
        },
        body: JSON.stringify({
          account_bank:    med.mobile_money_operateur === 'ORANGE' ? 'MOBILE_MONEY_CIV_CI' :
                           med.mobile_money_operateur === 'MTN'    ? 'MTN_CIV' : 'MOBILE_MONEY_CIV_CI',
          account_number:  med.mobile_money_numero.replace(/\D/g, ''),
          amount:          montant_medecin,
          currency:        'XOF',
          beneficiary_name:`${med.prenom || ''} ${med.nom || ''}`.trim(),
          reference:       payout_ref,
          narration:       `Paiement Dokita consultation ${consultation_id.slice(0, 8)}`
        })
      });
      const pdata = await r.json();

      const statut_payout = pdata.status === 'success' ? 'en_cours' : 'echec';

      await supabase.from('paiements').insert([{
        transaction_id:  payout_ref,
        patient_id:      'PAYOUT',
        consultation_id: consultation_id || null,
        montant:         montant_medecin,
        devise:          'XOF',
        statut:          statut_payout,
        operateur:       med.mobile_money_operateur || null,
        created_at:      new Date().toISOString()
      }]);

      if (pdata.status !== 'success') {
        return res.status(400).json({ error: pdata.message || 'Payout échoué', details: pdata });
      }

      return res.status(200).json({
        ok:              true,
        montant_medecin,
        commission_pct:  Math.round(commission * 100),
        payout_ref
      });

    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ══════════════════════════════════════════════
  // ACTION : payout_pharmacie — virer la part pharmacie après retrait confirmé
  // Escrow : Dokita retient 5%, reverse 95% à la pharmacie
  // Appelé par pharmacie.html après confirmerLivraison()
  // Auth : x-payout-secret
  // ══════════════════════════════════════════════
  if (req.method === 'POST' && action === 'payout_pharmacie') {
    const secret = req.headers['x-payout-secret'];
    if (!secret || secret !== process.env.PAYOUT_SECRET) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { ao_id, pharmacie_id, pharmacie_nom, montant_total, mobile_money_numero, mobile_money_operateur } = req.body || {};
    if (!ao_id || !montant_total) {
      return res.status(400).json({ error: 'ao_id et montant_total requis' });
    }

    const COMMISSION_DOKITA = 0.05; // 5%
    const montant_pharmacie = Math.round(montant_total * (1 - COMMISSION_DOKITA));
    const commission_dokita = montant_total - montant_pharmacie;

    if (!mobile_money_numero) {
      return res.status(400).json({ error: 'Numéro mobile money pharmacie non renseigné' });
    }

    const payout_ref = 'PAYOUT-PH-' + ao_id.slice(0, 8).toUpperCase() + '-' + Date.now();

    try {
      const r = await fetch(`${FLW_BASE}/transfers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FLW_SECRET}`,
          'Content-Type':  'application/json'
        },
        body: JSON.stringify({
          account_bank:    mobile_money_operateur === 'ORANGE' ? 'MOBILE_MONEY_CIV_CI' :
                           mobile_money_operateur === 'MTN'    ? 'MTN_CIV' : 'MOBILE_MONEY_CIV_CI',
          account_number:  mobile_money_numero.replace(/\D/g, ''),
          amount:          montant_pharmacie,
          currency:        'XOF',
          beneficiary_name: pharmacie_nom || 'Pharmacie Dokita',
          reference:       payout_ref,
          narration:       `Paiement Dokita médicaments AO ${ao_id.slice(0, 8)}`
        })
      });
      const pdata = await r.json();

      const statut_payout = pdata.status === 'success' ? 'en_cours' : 'echec';

      // Enregistrer le payout
      await supabase.from('paiements').insert([{
        transaction_id:  payout_ref,
        patient_id:      'PAYOUT-PHARMA',
        montant:         montant_pharmacie,
        devise:          'XOF',
        statut:          statut_payout,
        operateur:       mobile_money_operateur || null,
        created_at:      new Date().toISOString()
      }]);

      // Mettre à jour l'AO avec le statut payout
      await supabase.from('appels_offres')
        .update({ payout_statut: 'en_cours', updated_at: new Date().toISOString() })
        .eq('ao_id', ao_id);

      if (pdata.status !== 'success') {
        return res.status(400).json({ error: pdata.message || 'Payout pharmacie échoué' });
      }

      return res.status(200).json({
        ok:                true,
        montant_pharmacie,
        commission_dokita,
        commission_pct:    5,
        payout_ref
      });

    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(404).json({ error: 'Action inconnue : ' + action });
}
