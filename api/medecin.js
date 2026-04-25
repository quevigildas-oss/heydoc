// api/medecin.js
// Endpoints médecin — protégés JWT

const supabase = require('./_lib/supabase');
const authMiddleware = require('./_middleware/auth');
const { rbacMedecin } = require('./_middleware/rbac');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await new Promise((resolve, reject) => {
    authMiddleware(req, res, (err) => err ? reject(err) : resolve());
  }).catch(() => null);
  if (res.writableEnded) return;

  await new Promise((resolve, reject) => {
    rbacMedecin(req, res, (err) => err ? reject(err) : resolve());
  }).catch(() => null);
  if (res.writableEnded) return;

  const medecinId = req.user.id;
  const { action } = req.query;

  try {
    // GET /api/medecin?action=consultations
    if (req.method === 'GET' && action === 'consultations') {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('medecin_id', medecinId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/medecin?action=dossier&patient_id=xxx
    if (req.method === 'GET' && action === 'dossier') {
      const patientId = req.query.patient_id;
      if (!patientId) return res.status(400).json({ error: 'patient_id requis' });
      // Vérifier que ce patient a bien une consultation avec ce médecin
      const { data: check } = await supabase
        .from('consultations')
        .select('id')
        .eq('medecin_id', medecinId)
        .eq('patient_id', patientId)
        .limit(1);
      if (!check || !check.length) return res.status(403).json({ error: 'Patient non associé à ce médecin' });
      const { data, error } = await supabase
        .from('dossier_medical')
        .select('id,patient_id,nom,type_document,mime_type,taille_octets,source,statut,valeur,note,created_at,visible_medecin,resultat_ia,extraction_json')
        .eq('patient_id', patientId)
        .eq('statut', 'actif')
        .eq('visible_medecin', true)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/medecin?action=profil
    if (req.method === 'GET' && action === 'profil') {
      const { data, error } = await supabase
        .from('medecins').select('*').eq('id', medecinId).single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/medecin?action=agenda
    if (req.method === 'GET' && action === 'agenda') {
      const { data, error } = await supabase
        .from('agenda')
        .select('*')
        .eq('medecin_id', medecinId)
        .order('date_heure', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // PATCH /api/medecin?action=profil
    if (req.method === 'PATCH' && action === 'profil') {
      const updates = req.body;
      const allowed = ['prenom','nom','sexe','specialite','sous_specialite',
                       'annees_experience','email','telephone','whatsapp',
                       'ville','pays','quartier','latitude','longitude',
                       'consultation_distance','visite_domicile','urgences',
                       'langues_parlees','jours_consultation','tarif_consultation',
                       'devise','paiement_mobile','accepte_assurance',
                       'signature_base64','updated_at'];
      const safe = {};
      allowed.forEach(k => { if (updates[k] !== undefined) safe[k] = updates[k]; });
      const { error } = await supabase
        .from('medecins').update(safe).eq('id', medecinId);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // PATCH /api/medecin?action=consultation&id=xxx
    if (req.method === 'PATCH' && action === 'consultation') {
      const consultId = req.query.id;
      if (!consultId) return res.status(400).json({ error: 'id requis' });
      // Vérifier appartenance
      const { data: check } = await supabase
        .from('consultations').select('id')
        .eq('id', consultId).eq('medecin_id', medecinId).limit(1);
      if (!check || !check.length) return res.status(403).json({ error: 'Consultation non autorisée' });
      const { error } = await supabase
        .from('consultations').update(req.body).eq('id', consultId);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // POST /api/medecin?action=ordonnance
    if (req.method === 'POST' && action === 'ordonnance') {
      const { data, error } = await supabase
        .from('ordonnances')
        .insert({ ...req.body, medecin_id: medecinId })
        .select('id').single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    // POST /api/medecin?action=document
    if (req.method === 'POST' && action === 'document') {
      const { data, error } = await supabase
        .from('dossier_medical')
        .insert({ ...req.body, source: 'medecin', visible_medecin: true, statut: 'actif' })
        .select('id').single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    return res.status(404).json({ error: 'Action non reconnue: ' + action });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
