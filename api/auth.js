// api/auth.js
// VERSION : V1.2 — 2026-06-15
// FIX     : profils — fusion email + compte_parent_id (membres famille avec email=null, ex: Akouvi)
//           étaient absents de data.profils au login, n'apparaissaient qu'au reload via profils_famille
// V1.1 — 2026-05-17 : patient_id (PAT-...) ajouté dans le payload JWT
// Authentification patient + médecin → retourne JWT
const supabase = require('./_lib/supabase');
const { signerToken } = require('./_lib/jwt');
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const { type, email, code, ordre } = req.body || {};
  // ── Auth patient ──
  if (type === 'patient') {
    if (!email || !code) return res.status(400).json({ error: 'Email et code requis' });
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, patient_id, prenom, nom, email, code_acces, ia_consent, statut_compte')
      .eq('email', email.toLowerCase().trim())
      .limit(10);
    if (error) return res.status(500).json({ error: error.message });
    if (!patients || !patients.length) return res.status(401).json({ error: 'Email non trouvé' });
    const patient = patients.find(p => p.code_acces === code);
    if (!patient) return res.status(401).json({ error: 'Code incorrect' });
    // Charger tous les profils famille associés à cet email
    const SELECT_PROFILS = 'id, patient_id, prenom, nom, nom_complet, sexe, date_naissance, poids, taille, groupe_sanguin, langue_preferee, ville, telephone, antecedents, allergies, traitements_reguliers, lien_familial, ia_consent, parrain_id, credit_reduction, statut_compte, compte_parent_id, code_parrainage';
    const { data: profilsEmail, error: errProfils } = await supabase
      .from('patients')
      .select(SELECT_PROFILS)
      .eq('email', email.toLowerCase().trim());
    if (errProfils) return res.status(500).json({ error: errProfils.message });
    // Charger les membres famille liés par compte_parent_id (ex: Akouvi, email=null)
    const { data: profilsParent, error: errParent } = await supabase
      .from('patients')
      .select(SELECT_PROFILS)
      .eq('compte_parent_id', patient.id);
    if (errParent) return res.status(500).json({ error: errParent.message });
    // Fusionner et dédupliquer par id
    const seenIds = new Set();
    const profils = [];
    [...(profilsEmail || []), ...(profilsParent || [])].forEach(p => {
      if (!seenIds.has(p.id)) { seenIds.add(p.id); profils.push(p); }
    });
    const token = signerToken({
      id: patient.id,
      patient_id: patient.patient_id,  // format PAT-XX-... pour filtres DB
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
    const { data: medecins, error } = await supabase
      .from('medecins')
      .select('id, prenom, nom, nom_complet, specialite, email, numero_ordre, signature_base64, statut, partenaire_dokita, essai_gratuit_jusqu_au, code_acces')
      .eq('numero_ordre', ordre.trim())
      .eq('statut', 'Actif')
      .limit(1);
    if (error) return res.status(500).json({ error: error.message });
    if (!medecins || !medecins.length) return res.status(401).json({ error: 'Médecin non trouvé ou inactif' });
    const med = medecins[0];
    if (!med.partenaire_dokita) return res.status(401).json({ error: 'Compte non partenaire Dokita' });
    if (med.code_acces !== code) return res.status(401).json({ error: 'Code incorrect' });
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
