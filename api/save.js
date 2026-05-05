// /api/save.js
// DOKITA — Sauvegarde consultation dans Supabase
// V4.9 — Ajout notification email médecin via Resend
// V4.10 — Fix module.exports + mapping champs OMS

const handler = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-dokita-key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const dokitaKey = req.headers['x-dokita-key'];
  if (dokitaKey !== process.env.DOKITA_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  const RESEND_KEY   = process.env.RESEND_KEY;
  const IS_TEST      = process.env.DOKITA_ENV !== 'prod';

  try {
    const body = req.body;

    if (!body || !body.patient_id) {
      return res.status(400).json({ error: 'patient_id requis' });
    }

    const now     = new Date();
    const ts      = now.getTime();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const hStr    = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    const consultationId = 'DOS-' + body.patient_id + '-' + dateStr + '-' + hStr + '-' + String(ts).slice(-4);

    const payload = {
      consultation_id:     consultationId,
      patient_id:          body.patient_id        || '',
      patient_nom:         body.patient_nom || body.nom || '',
      patient_age:         parseInt(body.patient_age || body.age) || null,
      patient_poids:       parseFloat(body.patient_poids || body.poids) || null,
      patient_ville:       body.patient_ville || body.ville || 'Non renseignee',
      patient_voyage:      body.patient_voyage || body.voyage || 'Aucun',
      symptomes:           body.symptomes          || '',
      diagnostic_ia:       body.diagnostic_ia || body.diagnostic || '',
      examens_recommandes: body.examens_recommandes || body.examens || '',
      recommandations_oms: body.recommandations_oms || body.recommandations || '',
      medicaments_oms:     body.medicaments_oms    || '',
      contre_indications:  body.contre_indications || '',
      note_historique:     body.note_historique    || '',
      sources_oms:         body.sources_oms || body.sources || '',
      medecin_id:          body.medecin_id || null,
      statut:              'en_attente',
      validation_ia:       'EN_ATTENTE',
      is_test:             IS_TEST
    };

    const insertRes = await fetch(SUPABASE_URL + '/rest/v1/consultations', {
      method: 'POST',
      headers: {
        'apikey':        SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type':  'application/json',
        'Prefer':        'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      console.error('Supabase insert error:', err);
      return res.status(500).json({ error: 'Erreur Supabase', detail: err });
    }

    const inserted = await insertRes.json();
    const consultId = inserted && inserted[0] ? inserted[0].id : null;

    console.log('Consultation creee — ID: ' + consultationId + ' | is_test: ' + IS_TEST + ' | uuid: ' + consultId);

    // Notification email medecin via Resend
    if (RESEND_KEY) {
      try {
        const medecinRes = await fetch(
          SUPABASE_URL + '/rest/v1/medecins?statut=ilike.actif&select=nom,prenom,email&limit=10',
          { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
        );
        const medecins = await medecinRes.json();
        const destinataires = Array.isArray(medecins)
          ? medecins.filter(function(m) { return m.email; }).map(function(m) { return m.email; })
          : [];

        if (destinataires.length > 0) {
          const medecinDest = medecins.find(function(m) { return m.email === destinataires[0]; });
          const nomMedecin  = medecinDest ? ('Dr. ' + (medecinDest.prenom || '') + ' ' + (medecinDest.nom || '')).trim() : 'Dr.';
          const dateConsult = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

          const emailBody = 'Bonjour ' + nomMedecin + ',\n\nNouveau patient via Dokita.\n\n'
            + 'Patient: ' + (payload.patient_nom || 'Patient') + '\n'
            + 'Date: ' + dateConsult + '\n'
            + 'ID: ' + consultationId + '\n\n'
            + 'Symptomes:\n' + (payload.symptomes || '-') + '\n\n'
            + 'Diagnostic IA:\n' + (payload.diagnostic_ia || '-') + '\n\n'
            + 'Connectez-vous a Dokita Pro pour voir le dossier complet.\n\nDokita';

          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from:    'Dokita <onboarding@resend.dev>',
              to:      destinataires,
              subject: '[Dokita] Dossier — ' + (payload.patient_nom || 'Patient') + ' — ' + dateStr,
              text:    emailBody
            })
          });

          if (emailRes.ok) {
            console.log('Email medecin envoye a: ' + destinataires.join(', '));
          } else {
            console.warn('Erreur envoi email Resend:', await emailRes.text());
          }
        }
      } catch (emailErr) {
        console.warn('Erreur notification email (non bloquante):', emailErr.message);
      }
    } else {
      console.warn('RESEND_KEY non configuree — email medecin non envoye');
    }

    // NOTE: Creation auto des examens desactivee intentionnellement.
    // Les examens sont saisis par le medecin dans DokitaPro.
    // Le champ examens_recommandes est conserve pour reference IA uniquement.

    return res.status(200).json({
      success:         true,
      consultation_id: consultationId,
      uuid:            consultId,
      is_test:         IS_TEST
    });

  } catch (e) {
    console.error('Save error:', e);
    return res.status(500).json({ error: e.message });
  }
};

module.exports = handler;
