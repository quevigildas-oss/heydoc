// api/auth.js
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
      .select('id, prenom, nom, email, code_acces, ia_consent')
      .eq('email', email.toLowerCase().trim())
      .limit(10);

    if (error) return res.status(500).json({ error: error.message });
    if (!patients || !patients.length) return res.status(401).json({ error: 'Email non trouvé' });

    // Vérifier le code — peut y avoir plusieurs profils famille avec le même email
    const patient = patients.find(p => p.code_acces === code);
    if (!patient) return res.status(401).json({ error: 'Code incorrect' });

    // Charger tous les profils famille associés à cet email
    const { data: profils } = await supabase
      .from('patients')
      .select('id, prenom, nom, sexe, naiss, poids, taille, groupe_sanguin, langue_preferee, ville, antecedents, allergies, lien_familial, ia_consent')
      .eq('email', email.toLowerCase().trim());

    const token = signerToken({
      id: patient.id,
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
      .select('id, prenom, nom, nom_complet, specialite, email, numero_ordre, signature_base64, statut, partenaire_dokita')
      .eq('numero_ordre', ordre.trim())
      .eq('statut', 'Actif')
      .limit(1);

    if (error) return res.status(500).json({ error: error.message });
    if (!medecins || !medecins.length) return res.status(401).json({ error: 'Médecin non trouvé ou inactif' });

    const med = medecins[0];

    // Vérifier le code d'accès
    const { data: check } = await supabase
      .from('medecins')
      .select('id')
      .eq('id', med.id)
      .eq('code_acces', code)
      .limit(1);

    if (!check || !check.length) return res.status(401).json({ error: 'Code incorrect' });

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
        partenaire: med.partenaire_dokita
      }
    });
  }

  return res.status(400).json({ error: 'Type auth invalide — patient ou medecin requis' });
};
