// /api/save.js
// DOKITA — Sauvegarde consultation dans Supabase
// Remplace Make webhook → Notion
// Appelé depuis Dokita V4.2 après RESUME_CONSULTATION
// V4.9 — Ajout notification email médecin via Resend

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-dokita-key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth
  const dokitaKey = req.headers['x-dokita-key'];
  if (dokitaKey !== process.env.DOKITA_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  const RESEND_KEY   = process.env.RESEND_KEY;
  const IS_TEST      = process.env.DOKITA_ENV !== 'prod'; // true en dev, false en prod

  try {
    const body = req.body;

    // ── Valider les champs minimum requis ──
    if (!body || !body.patient_id) {
      return res.status(400).json({ error: 'patient_id requis' });
    }

    // ── Générer un ID consultation unique ──
    const now     = new Date();
    const ts      = now.getTime();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const hStr    = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    const consultationId = `DOS-${body.patient_id}-${dateStr}-${hStr}-${String(ts).slice(-4)}`;

    // ── Construire le payload Supabase ──
    const payload = {
      consultation_id:      consultationId,

      // Patient
      patient_id:           body.patient_id        || '',
      patient_nom:          body.patient_nom || body.nom  || '',
      patient_age:          parseInt(body.patient_age || body.age) || null,
      patient_poids:        parseFloat(body.patient_poids || body.poids) || null,
      patient_ville:        body.patient_ville || body.ville || 'Non renseignée',
      patient_voyage:       body.patient_voyage || body.voyage || 'Aucun',

      // Consultation Dr. AfriBot
      symptomes:            body.symptomes          || '',
      diagnostic_ia:        body.diagnostic_ia || body.diagnostic || '',

      // Recommandations OMS depuis Supabase pgvector
      // ⚠️ Ces champs sont masqués au médecin jusqu'à soumission prescription
      examens_recommandes:  body.examens            || '',
      recommandations_oms:  body.recommandations    || '',
      medicaments_oms:      body.medicaments_oms    || '',
      contre_indications:   body.contre_indications || '',
      note_historique:      body.note_historique     || '',
      sources_oms:          body.sources            || '',

      medecin_id:           body.medecin_id || null,

      // Statut initial
      statut:               'en_attente',
      validation_ia:        'EN_ATTENTE',

      // Environnement
      is_test:              IS_TEST
    };

    // ── Insérer dans Supabase ──
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/consultations`, {
      method: 'POST',
      headers: {
        'apikey':        SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
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
    const consultId = inserted?.[0]?.id || null;

    console.log(`✅ Consultation créée — ID: ${consultationId} | is_test: ${IS_TEST} | uuid: ${consultId}`);

    // ── Notification email médecin via Resend ──
    // Récupérer l'email du médecin assigné depuis Supabase (si medecin_id fourni)
    // Sinon envoyer à tous les médecins actifs
    if (RESEND_KEY) {
      try {
        // Récupérer les médecins actifs depuis Supabase
        const medecinRes = await fetch(
          `${SUPABASE_URL}/rest/v1/medecins?statut=ilike.actif&select=nom,prenom,email&limit=10`,
          {
            headers: {
              'apikey':        SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`
            }
          }
        );
        const medecins = await medecinRes.json();
        const destinataires = Array.isArray(medecins)
          ? medecins.filter(m => m.email).map(m => m.email)
          : [];

        if (destinataires.length > 0) {
          // Trouver le médecin destinataire pour personnaliser le message
          const medecinDestinataire = medecins.find(m => m.email === destinataires[0]);
          const nomMedecin   = medecinDestinataire
            ? `Dr. ${medecinDestinataire.prenom || ''} ${medecinDestinataire.nom || ''}`.trim()
            : 'Dr.';

          const nomPatient   = payload.patient_nom || 'Patient';
          const agePatient   = payload.patient_age ? `${payload.patient_age} ans` : 'Non renseigné';
          const sexePatient  = body.patient_sexe || body.sexe || 'Non renseigné';
          const poidsPatient = payload.patient_poids ? `${payload.patient_poids} kg` : 'Non renseigné';
          const villePatient = payload.patient_ville || 'Non renseignée';
          const symptomes    = payload.symptomes || '—';
          const diagnostic   = payload.diagnostic_ia || '—';
          const dateConsult  = now.toLocaleDateString('fr-FR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
          });

          const emailBody = `Bonjour ${nomMedecin},

Nous vous adressons un nouveau patient via la plateforme Dokita.

=== PATIENT ===
Nom: ${nomPatient}
Âge: ${agePatient}
Sexe: ${sexePatient}
Poids: ${poidsPatient}
Ville: ${villePatient}

=== CONSULTATION ===
Date: ${dateConsult}
ID: ${consultationId}

SYMPTÔMES:
${symptomes}

DIAGNOSTIC IA (Dr. AfriBot):
${diagnostic}

---
Veuillez vous connecter à Dokita Pro pour consulter le dossier complet. Merci de votre engagement à nos côtés.

Dokita — Outil d'aide à la décision médicale`;

          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_KEY}`,
              'Content-Type':  'application/json'
            },
            body: JSON.stringify({
              from:    'Dokita <onboarding@resend.dev>',
              to:      destinataires,
              subject: `[Dokita] Dossier — ${nomPatient} — ${dateStr}`,
              text:    emailBody
            })
          });

          if (emailRes.ok) {
            console.log(`✅ Email médecin envoyé à: ${destinataires.join(', ')}`);
          } else {
            const emailErr = await emailRes.text();
            console.warn('⚠️ Erreur envoi email Resend:', emailErr);
          }
        } else {
          console.warn('⚠️ Aucun médecin actif avec email trouvé');
        }
      } catch (emailErr) {
        // L'erreur email ne doit pas bloquer la réponse patient
        console.warn('⚠️ Erreur notification email (non bloquante):', emailErr.message);
      }
    } else {
      console.warn('⚠️ RESEND_KEY non configurée — email médecin non envoyé');
    }

    // ── Créer les examens si obligatoires ──
    // Extraction simple depuis le texte examens_recommandes
    if (consultId && payload.examens_recommandes) {
      const examensTexte = payload.examens_recommandes;

      // Détecter les examens obligatoires (contient "OUI" ou "obligatoire")
      const lignes = examensTexte.split(/[,|\n]/)
        .map(l => l.trim())
        .filter(l => l.length > 3);

      const examensPayload = lignes.map(type_examen => ({
        consultation_id:      consultId,
        patient_id:           payload.patient_id,
        type_examen:          type_examen.replace(/^(✅|⚠️|OUI|NON)\s*/i, '').trim(),
        obligatoire:          /obligatoire|✅\s*OUI/i.test(type_examen),
        source_recommandation: payload.sources_oms || '',
        statut:               'prescrit',
        is_test:              IS_TEST
      })).filter(e => e.type_examen.length > 2);

      if (examensPayload.length > 0) {
        const examRes = await fetch(`${SUPABASE_URL}/rest/v1/examens`, {
          method: 'POST',
          headers: {
            'apikey':        SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type':  'application/json',
            'Prefer':        'return=minimal'
          },
          body: JSON.stringify(examensPayload)
        });

        if (examRes.ok) {
          console.log(`✅ ${examensPayload.length} examens créés pour consultation ${consultationId}`);
        } else {
          console.warn('⚠️ Erreur création examens:', await examRes.text());
        }
      }
    }

    // ── Retourner succès ──
    return res.status(200).json({
      success:         true,
      consultation_id: consultationId,
      uuid:            consultId,
      is_test:         IS_TEST,
      examens_crees:   payload.examens_recommandes ? true : false
    });

  } catch (e) {
    console.error('Save error:', e);
    return res.status(500).json({ error: e.message });
  }
}
