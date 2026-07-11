// ============================================
// DOKITA WHATSAPP API — api/whatsapp.js
// VERSION : V1.4 (2026-07-10) : action notifier_annulation_rdv (annulation par le médecin)
// VERSION : V1.3 (2026-07-10) : message notifier_rdv — émojis date retirés (préfixes Date:/Heure:)
// VERSION : V1.2
// DATE    : 2026-07-09
// AJOUT   : action=notifier_rdv — notification WhatsApp de téléconsultation
//           planifiée par le médecin (pattern envoyer_ao). Sandbox Twilio :
//           n'arrive qu'aux numéros enrôlés tant que Meta Cloud n'est pas actif.
// V1.1 — 2026-05-26 : Twilio WhatsApp Sandbox → prod Meta Cloud API
// ============================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  // Auth JWT (même système que patient/medecin)
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Non autorisé' });

  const action = req.query.action;

  // ── Credentials Twilio (env vars Vercel) ──
  const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
  const FROM_NUMBER = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // sandbox par défaut

  if (!ACCOUNT_SID || !AUTH_TOKEN) {
    return res.status(500).json({ error: 'Credentials Twilio manquants' });
  }

  // ── Helper envoi message WhatsApp ──
  async function sendWhatsApp(to, body) {
    const toFormatted = 'whatsapp:' + (to.startsWith('+') ? to : '+' + to);
    const credentials = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');
    const url = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;

    const params = new URLSearchParams();
    params.append('From', FROM_NUMBER);
    params.append('To', toFormatted);
    params.append('Body', body);

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Twilio error ' + r.status);
    return data.sid;
  }

  // ── Helper : date ISO (YYYY-MM-DD) → libellé lisible FR ──
  function dateLisible(iso) {
    try {
      const JOURS = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
      const MOIS  = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
      const d = new Date(iso + 'T00:00:00');
      if (isNaN(d.getTime())) return iso;
      return JOURS[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS[d.getMonth()];
    } catch (e) { return iso; }
  }

  // ── ACTION : envoyer AO aux pharmacies ──
  if (action === 'envoyer_ao') {
    const { pharmacies, ordonnance, patient, ao_url_base } = req.body || {};

    if (!pharmacies || !pharmacies.length) {
      return res.status(400).json({ error: 'pharmacies[] requis' });
    }
    if (!ordonnance || !ordonnance.medicaments) {
      return res.status(400).json({ error: 'ordonnance.medicaments requis' });
    }

    // Construire le message AO
    const medsList = ordonnance.medicaments
      .map((m, i) => `${i + 1}. ${m.nom}${m.dosage ? ' ' + m.dosage : ''} — ${m.qte || ''} ${m.unite || 'unité(s)'}`)
      .join('\n');

    const results = [];
    const errors  = [];

    for (const pharmacie of pharmacies) {
      try {
        const lien = `${ao_url_base || 'https://heydoc-mu.vercel.app/pharmacie'}?id=${pharmacie.ao_id}`;
        const message = [
          `🏥 *DOKITA — Appel d'offres médicaments*`,
          ``,
          `Bonjour *${pharmacie.nom}*,`,
          ``,
          `Un patient a besoin des médicaments suivants :`,
          medsList,
          ``,
          `📦 *Êtes-vous en mesure de fournir ces médicaments ?*`,
          `Soumettez votre offre (prix + quantité disponible) en cliquant sur le lien ci-dessous :`,
          ``,
          lien,
          ``,
          `⏱️ Vous avez *15 minutes* pour répondre.`,
          `Si vous n'êtes pas disponible, ignorez ce message.`,
          ``,
          `_Dokitrust — Plateforme médicale digitale_`
        ].join('\n');

        const sid = await sendWhatsApp(pharmacie.telephone, message);
        results.push({ pharmacie_id: pharmacie.id, nom: pharmacie.nom, sid });
      } catch (e) {
        errors.push({ pharmacie_id: pharmacie.id, nom: pharmacie.nom, error: e.message });
      }
    }

    return res.status(200).json({
      envoyes: results.length,
      erreurs: errors.length,
      results,
      errors
    });
  }

  // ── ACTION : notifier_rdv — téléconsultation planifiée par le médecin (V1.2) ──
  if (action === 'notifier_rdv') {
    const { telephone, patient_nom, date, heure, medecin_nom } = req.body || {};
    if (!telephone || !date || !heure) {
      return res.status(400).json({ error: 'telephone, date et heure requis' });
    }

    const message = [
      `*DOKITA — Téléconsultation confirmée*`,
      ``,
      `Bonjour${patient_nom ? ' ' + patient_nom : ''},`,
      ``,
      `Votre téléconsultation${medecin_nom ? ' avec le Dr ' + medecin_nom : ''} est confirmée :`,
      `Date : *${dateLisible(date)}*`,
      `Heure : *${String(heure).slice(0, 5)}*`,
      ``,
      `Ce rendez-vous est visible dans votre application Dokita (rubrique Rendez-vous).`,
      ``,
      `📱 Quelques minutes avant l'heure, tenez votre téléphone à portée : votre médecin vous enverra le lien de connexion par WhatsApp au moment du rendez-vous.`,
      ``,
      `_Dokitrust — Plateforme médicale digitale_`
    ].join('\n');

    try {
      const sid = await sendWhatsApp(telephone, message);
      return res.status(200).json({ ok: true, sid });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── ACTION : notifier_annulation_rdv — téléconsultation annulée par le médecin (V1.4) ──
  if (action === 'notifier_annulation_rdv') {
    const { telephone, patient_nom, date, heure } = req.body || {};
    if (!telephone || !date) {
      return res.status(400).json({ error: 'telephone et date requis' });
    }
    const message = [
      `*DOKITA — Téléconsultation annulée*`,
      ``,
      `Bonjour${patient_nom ? ' ' + patient_nom : ''},`,
      ``,
      `Nous vous informons que votre téléconsultation prévue le *${dateLisible(date)}*${heure ? ' à *' + String(heure).slice(0,5) + '*' : ''} a été annulée par votre médecin.`,
      ``,
      `Un nouveau rendez-vous vous sera proposé prochainement. Nous vous prions de nous excuser pour la gêne occasionnée.`,
      ``,
      `_Dokitrust — Plateforme médicale digitale_`
    ].join('\n');
    try {
      const sid = await sendWhatsApp(telephone, message);
      return res.status(200).json({ ok: true, sid });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── ACTION : notifier patient (ordonnance prête, offre reçue) ──
  if (action === 'notifier_patient') {
    const { telephone, type, data: notifData } = req.body || {};
    if (!telephone || !type) {
      return res.status(400).json({ error: 'telephone et type requis' });
    }

    const messages = {
      ordonnance_prete: [
        `🏥 *DOKITA — Votre ordonnance est prête*`,
        ``,
        `Bonjour${notifData?.prenom ? ' ' + notifData.prenom : ''},`,
        ``,
        `Le Dr. ${notifData?.medecin || ''} a validé votre consultation.`,
        `Votre ordonnance est disponible dans l'application Dokita.`,
        ``,
        `💊 Vous pouvez maintenant commander vos médicaments auprès de nos pharmacies partenaires.`,
        ``,
        `_Dokitrust — Plateforme médicale digitale_`
      ].join('\n'),

      offre_recue: [
        `💊 *DOKITA — Offre reçue pour vos médicaments*`,
        ``,
        `Bonjour${notifData?.prenom ? ' ' + notifData.prenom : ''},`,
        ``,
        `*${notifData?.pharmacie || 'Une pharmacie'}* a soumis une offre pour votre commande.`,
        ``,
        `👉 Ouvrez l'application Dokita → Ordonnances → Offres Dokita pour comparer et choisir.`,
        ``,
        `_Dokitrust — Plateforme médicale digitale_`
      ].join('\n'),

      medicaments_prets: [
        `✅ *DOKITA — Médicaments prêts au retrait*`,
        ``,
        `Bonjour${notifData?.prenom ? ' ' + notifData.prenom : ''},`,
        ``,
        `Vos médicaments sont prêts chez *${notifData?.pharmacie || 'la pharmacie'}*.`,
        ``,
        `🔐 Votre code de retrait : *${notifData?.code_retrait || '------'}*`,
        `Présentez ce code au pharmacien.`,
        ``,
        `_Dokitrust — Plateforme médicale digitale_`
      ].join('\n')
    };

    const message = messages[type];
    if (!message) return res.status(400).json({ error: 'Type inconnu : ' + type });

    try {
      const sid = await sendWhatsApp(telephone, message);
      return res.status(200).json({ ok: true, sid });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── ACTION : notifier_pharmacie — informer pharmacie non retenue ──
  if (action === 'notifier_pharmacie') {
    const { telephone, type, data: notifData } = req.body || {};
    if (!telephone || !type) {
      return res.status(400).json({ error: 'telephone et type requis' });
    }

    const messages = {
      offre_non_retenue: [
        `🏥 *DOKITA — Information sur votre offre*`,
        ``,
        `Bonjour *${notifData?.pharmacie || 'Pharmacie partenaire'}*,`,
        ``,
        `Nous vous remercions sincèrement d'avoir répondu à notre appel d'offres et de la confiance que vous accordez à la plateforme Dokita.`,
        ``,
        `Pour cette commande, le patient a choisi une autre pharmacie partenaire.`,
        ``,
        `Votre réactivité et votre professionnalisme sont très appréciés. Nous espérons avoir l'opportunité de collaborer avec vous très prochainement.`,
        ``,
        `_Cordialement,_`,
        `_L'équipe Dokitrust_`
      ].join('\n')
    };

    const message = messages[type];
    if (!message) return res.status(400).json({ error: 'Type inconnu : ' + type });

    try {
      const sid = await sendWhatsApp(telephone, message);
      return res.status(200).json({ ok: true, sid });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(404).json({ error: 'Action inconnue : ' + action });
}
