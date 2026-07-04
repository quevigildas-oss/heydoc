// api/auth.js
// VERSION : V2.0 — 2026-07-04 (lot sécurité, session 17)
// AJOUTS  :
//   1. Hachage des codes d'accès (crypto.scrypt natif Node — AUCUNE dépendance npm).
//      Migration progressive : les codes stockés en clair sont vérifiés en clair
//      puis re-stockés hachés au premier login réussi. Les procédures manuelles
//      (INSERT médecin §9A) peuvent continuer d'insérer en clair : auto-migré.
//   2. Rate limiting via table auth_attempts (migration_auth_securite.sql) :
//      5 échecs / identifiant / 15 min, 20 échecs / IP / 15 min → 429.
//   3. Messages uniformisés anti-énumération : 'Identifiants incorrects'
//      (plus de distinction email/ordre inexistant vs code faux).
//   4. CORS restreint aux domaines Dokita (fini le '*').
//   5. Handlers type:'check_email' et type:'check_parrain' (attendus par le
//      front inscription lignes ~1358/1366 — absents depuis l'origine, la
//      détection de doublons et la validation parrain échouaient en silence).
// V1.2 — 2026-06-15 : fusion profils email + compte_parent_id (Akouvi)
// V1.1 — 2026-05-17 : patient_id (PAT-...) dans le payload JWT
const supabase = require('./_lib/supabase');
const { signerToken } = require('./_lib/jwt');
const crypto = require('crypto');

// ── CORS : origines autorisées (V2.0) ──
const ORIGINES_AUTORISEES = [
  'https://heydoc-mu.vercel.app',
  'https://heydoc-medecin.vercel.app'
];

// ── Hachage scrypt (natif Node, format scrypt$salt$hash) ──
function hacherCode(code) {
  const sel = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(code), sel, 64).toString('hex');
  return 'scrypt$' + sel + '$' + hash;
}
function verifierCode(code, stocke) {
  if (typeof stocke !== 'string') return { ok: false, clair: false };
  if (stocke.startsWith('scrypt$')) {
    const parts = stocke.split('$');
    if (parts.length !== 3) return { ok: false, clair: false };
    try {
      const attendu = Buffer.from(parts[2], 'hex');
      const calcule = crypto.scryptSync(String(code), parts[1], 64);
      return { ok: attendu.length === calcule.length && crypto.timingSafeEqual(attendu, calcule), clair: false };
    } catch (e) { return { ok: false, clair: false }; }
  }
  // Ancien format en clair → migration au prochain succès
  return { ok: stocke === String(code), clair: true };
}

// ── Rate limiting (table auth_attempts) ──
const FENETRE_MIN = 15, MAX_PAR_IDENT = 5, MAX_PAR_IP = 20;
function depuis() { return new Date(Date.now() - FENETRE_MIN * 60 * 1000).toISOString(); }
async function tropDeTentatives(ident, ip) {
  try {
    const { count: c1 } = await supabase.from('auth_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('identifiant', ident).gte('created_at', depuis());
    if ((c1 || 0) >= MAX_PAR_IDENT) return true;
    if (ip) {
      const { count: c2 } = await supabase.from('auth_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('ip', ip).gte('created_at', depuis());
      if ((c2 || 0) >= MAX_PAR_IP) return true;
    }
    return false;
  } catch (e) { return false; } // table absente → ne bloque pas le login (fail-open documenté)
}
async function noterEchec(ident, ip) {
  try { await supabase.from('auth_attempts').insert({ identifiant: ident, ip: ip || null }); } catch (e) {}
}
async function effacerTentatives(ident) {
  try { await supabase.from('auth_attempts').delete().eq('identifiant', ident); } catch (e) {}
}

module.exports = async function handler(req, res) {
  // ── CORS V2.0 : réfléchit l'origine si autorisée (aucun header sinon) ──
  const origine = req.headers.origin || '';
  if (ORIGINES_AUTORISEES.includes(origine)) {
    res.setHeader('Access-Control-Allow-Origin', origine);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { type, email, code, ordre } = req.body || {};
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null;
  const MSG_KO = 'Identifiants incorrects';
  const MSG_429 = 'Trop de tentatives — réessayez dans ' + FENETRE_MIN + ' minutes';

  // ── check_email (inscription) — V2.0, attendu par le front : { exists } ──
  if (type === 'check_email') {
    if (!email) return res.status(400).json({ error: 'email requis' });
    if (await tropDeTentatives('chk:' + String(email).toLowerCase().trim(), ip))
      return res.status(429).json({ error: MSG_429 });
    await noterEchec('chk:' + String(email).toLowerCase().trim(), ip); // compte les sondages
    const { data, error } = await supabase.from('patients')
      .select('id').eq('email', String(email).toLowerCase().trim()).limit(1);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ exists: !!(data && data.length) });
  }

  // ── check_parrain (inscription) — V2.0, attendu par le front : { valid, parrain_id } ──
  if (type === 'check_parrain') {
    const codeParrain = (req.body.code || '').trim();
    if (!codeParrain) return res.status(400).json({ error: 'code requis' });
    if (await tropDeTentatives('par:' + codeParrain.toUpperCase(), ip))
      return res.status(429).json({ error: MSG_429 });
    await noterEchec('par:' + codeParrain.toUpperCase(), ip);
    const { data, error } = await supabase.from('patients')
      .select('id').eq('code_parrainage', codeParrain.toUpperCase()).limit(1);
    if (error) return res.status(500).json({ error: error.message });
    if (data && data.length) return res.status(200).json({ valid: true, parrain_id: data[0].id });
    return res.status(200).json({ valid: false });
  }

  // ── Auth patient ──
  if (type === 'patient') {
    if (!email || !code) return res.status(400).json({ error: 'Email et code requis' });
    const ident = 'pat:' + String(email).toLowerCase().trim();
    if (await tropDeTentatives(ident, ip)) return res.status(429).json({ error: MSG_429 });

    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, patient_id, prenom, nom, email, code_acces, ia_consent, statut_compte')
      .eq('email', email.toLowerCase().trim())
      .limit(10);
    if (error) return res.status(500).json({ error: error.message });
    if (!patients || !patients.length) {
      await noterEchec(ident, ip);
      return res.status(401).json({ error: MSG_KO }); // uniforme (anti-énumération)
    }
    let patient = null, formatClair = false;
    for (const p of patients) {
      const v = verifierCode(code, p.code_acces);
      if (v.ok) { patient = p; formatClair = v.clair; break; }
    }
    if (!patient) {
      await noterEchec(ident, ip);
      return res.status(401).json({ error: MSG_KO });
    }
    // Migration progressive : re-stocker haché si l'ancien format en clair a matché
    if (formatClair) {
      try { await supabase.from('patients').update({ code_acces: hacherCode(code) }).eq('id', patient.id); }
      catch (e) {}
    }
    await effacerTentatives(ident);

    // Profils famille (email + compte_parent_id) — logique V1.2 inchangée
    const SELECT_PROFILS = 'id, patient_id, prenom, nom, nom_complet, sexe, date_naissance, poids, taille, groupe_sanguin, langue_preferee, ville, telephone, antecedents, allergies, traitements_reguliers, lien_familial, ia_consent, parrain_id, credit_reduction, statut_compte, compte_parent_id, code_parrainage';
    const { data: profilsEmail, error: errProfils } = await supabase
      .from('patients').select(SELECT_PROFILS).eq('email', email.toLowerCase().trim());
    if (errProfils) return res.status(500).json({ error: errProfils.message });
    const { data: profilsParent, error: errParent } = await supabase
      .from('patients').select(SELECT_PROFILS).eq('compte_parent_id', patient.id);
    if (errParent) return res.status(500).json({ error: errParent.message });
    const seenIds = new Set();
    const profils = [];
    [...(profilsEmail || []), ...(profilsParent || [])].forEach(p => {
      if (!seenIds.has(p.id)) { seenIds.add(p.id); profils.push(p); }
    });

    const token = signerToken({
      id: patient.id,
      patient_id: patient.patient_id,
      email: patient.email,
      role: 'patient'
    });
    return res.status(200).json({
      token,
      patientId: patient.id,
      profils: profils || [],
      ia_consent: patient.ia_consent
    });
  }

  // ── Auth médecin ──
  if (type === 'medecin') {
    if (!ordre || !code) return res.status(400).json({ error: 'N° ordre et code requis' });
    const ident = 'med:' + String(ordre).trim();
    if (await tropDeTentatives(ident, ip)) return res.status(429).json({ error: MSG_429 });

    const { data: medecins, error } = await supabase
      .from('medecins')
      .select('id, prenom, nom, nom_complet, specialite, email, numero_ordre, signature_base64, statut, partenaire_dokita, essai_gratuit_jusqu_au, code_acces')
      .eq('numero_ordre', ordre.trim())
      .eq('statut', 'Actif')
      .limit(1);
    if (error) return res.status(500).json({ error: error.message });
    if (!medecins || !medecins.length) {
      await noterEchec(ident, ip);
      return res.status(401).json({ error: MSG_KO }); // uniforme (anti-énumération)
    }
    const med = medecins[0];
    const v = verifierCode(code, med.code_acces);
    if (!v.ok) {
      await noterEchec(ident, ip);
      return res.status(401).json({ error: MSG_KO });
    }
    // Le code est prouvé → le message métier "non partenaire" redevient légitime
    if (!med.partenaire_dokita) return res.status(401).json({ error: 'Compte non partenaire Dokita' });
    if (v.clair) {
      try { await supabase.from('medecins').update({ code_acces: hacherCode(code) }).eq('id', med.id); }
      catch (e) {}
    }
    await effacerTentatives(ident);

    const token = signerToken({
      id: med.id,
      email: med.email,
      role: 'medecin',
      ordre: med.numero_ordre
    });
    return res.status(200).json({
      token,
      medecin: {
        supabaseId: med.id,
        nom: med.nom_complet || `Dr. ${med.prenom} ${med.nom}`,
        spec: med.specialite,
        email: med.email,
        ordre: med.numero_ordre,
        signature_base64: med.signature_base64,
        partenaire: med.partenaire_dokita,
        essai_gratuit_jusqu_au: med.essai_gratuit_jusqu_au || null
      }
    });
  }

  return res.status(400).json({ error: 'Type auth invalide — patient ou medecin requis' });
};
