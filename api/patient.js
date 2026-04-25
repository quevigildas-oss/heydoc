// api/patient.js
// Endpoints patient — protégés JWT

const supabase = require('./_lib/supabase');
const authMiddleware = require('./_middleware/auth');
const { rbacPatient } = require('./_middleware/rbac');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Vérifier JWT
  await new Promise((resolve, reject) => {
    authMiddleware(req, res, (err) => err ? reject(err) : resolve());
  }).catch(() => null);
  if (res.writableEnded) return;

  // Vérifier rôle patient
  await new Promise((resolve, reject) => {
    rbacPatient(req, res, (err) => err ? reject(err) : resolve());
  }).catch(() => null);
  if (res.writableEnded) return;

  const patientId = req.user.id;
  const { action } = req.query;

  try {
    // GET /api/patient?action=profil
    if (req.method === 'GET' && action === 'profil') {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/patient?action=profils_famille
    if (req.method === 'GET' && action === 'profils_famille') {
      const { data: profil } = await supabase
        .from('patients').select('email').eq('id', patientId).single();
      const { data, error } = await supabase
        .from('patients').select('*').eq('email', profil.email);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/patient?action=consultations
    if (req.method === 'GET' && action === 'consultations') {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/patient?action=examens
    if (req.method === 'GET' && action === 'examens') {
      const { data, error } = await supabase
        .from('examens')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/patient?action=ordonnances
    if (req.method === 'GET' && action === 'ordonnances') {
      const { data, error } = await supabase
        .from('ordonnances')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/patient?action=dossier
    if (req.method === 'GET' && action === 'dossier') {
      const { data, error } = await supabase
        .from('dossier_medical')
        .select('id,patient_id,nom,type_document,mime_type,taille_octets,source,statut,valeur,note,created_at,visible_medecin,resultat_ia,extraction_json')
        .eq('patient_id', patientId)
        .eq('statut', 'actif')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/patient?action=appels_offres
    if (req.method === 'GET' && action === 'appels_offres') {
      const consultId = req.query.consultation_id;
      if (!consultId) return res.status(400).json({ error: 'consultation_id requis' });
      const { data, error } = await supabase
        .from('appels_offres')
        .select('*')
        .eq('consultation_id', consultId);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // PATCH /api/patient?action=profil
    if (req.method === 'PATCH' && action === 'profil') {
      const updates = req.body;
      // Champs autorisés uniquement
      const allowed = ['prenom','nom','naiss','sexe','poids','taille','groupe_sanguin',
                       'langue_preferee','telephone','email','ville','antecedents',
                       'allergies','ia_consent','ia_consent_date'];
      const safe = {};
      allowed.forEach(k => { if (updates[k] !== undefined) safe[k] = updates[k]; });
      const { error } = await supabase
        .from('patients').update(safe).eq('id', patientId);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // POST /api/patient?action=document
    if (req.method === 'POST' && action === 'document') {
      const { nom, type_document, mime_type, contenu_base64, taille_octets, note, source } = req.body;
      const { data, error } = await supabase
        .from('dossier_medical')
        .insert({
          patient_id: patientId,
          nom, type_document, mime_type, contenu_base64,
          taille_octets, note,
          source: source || 'patient',
          statut: 'actif',
          visible_medecin: true
        })
        .select('id').single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    return res.status(404).json({ error: 'Action non reconnue: ' + action });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
