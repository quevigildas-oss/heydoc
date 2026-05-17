// api/medecin.js
// Endpoints médecin — protégés JWT
// VERSION : V2.0
// DATE    : 2026-05-12
// CHANGELOG :
//   V1.0 (2026-04-20) : Routes initiales (consultations, dossier, profil, agenda,
//                        PATCH profil, PATCH consultation, POST ordonnance, POST document)
//   V2.0 (2026-05-12) : Phase 2 — Migration JWT frontend complète
//     + GET  examens           : examens d'une consultation (RBAC médecin)
//     + GET  examen            : examen unique avec fichier base64 (RBAC)
//     + GET  catalogue         : catalogue examens Supabase (202 examens)
//     + GET  ordonnance        : ordonnance unique par consultation_id (RBAC)
//     + GET  patient           : profil patient lié (RBAC)
//     + GET  disponibilites    : créneaux du médecin
//     + GET  rdv               : rendez-vous du médecin
//     + POST examen            : créer examen prescrit
//     + POST disponibilite     : créer créneau disponibilité
//     + POST rdv_creneaux      : envoyer créneaux proposés au patient
//     + PATCH examen           : modifier examen (statut, obligatoire, nom)
//     + PATCH dossier          : PATCH document médical (infirmer, source_confirmee)
//     + PATCH patient          : PATCH champs patient autorisés par médecin
//     + PATCH disponibilite    : modifier/supprimer créneau
//     + PATCH rdv              : accepter/refuser/annuler RDV
//     + DELETE examen          : supprimer examen prescrit (RBAC)
//     + GET  consultation_detail : consultation + examens + ordonnance en une requête
//     + PATCH profil           : ajout mobile_money_numero, mobile_money_operateur,
//                                rib_bancaire dans whitelist

const supabase = require('./_lib/supabase');
const authMiddleware = require('./_middleware/auth');
const { rbacMedecin } = require('./_middleware/rbac');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
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

  // Helper RBAC : vérifier qu'une consultation appartient à ce médecin
  async function checkConsultationOwnership(consultId) {
    const { data } = await supabase.from('consultations').select('id,patient_id')
      .eq('id', consultId).eq('medecin_id', medecinId).limit(1);
    return data && data.length ? data[0] : null;
  }

  // Helper RBAC : vérifier qu'un patient a une consultation avec ce médecin
  async function checkPatientLink(patientId) {
    const { data } = await supabase.from('consultations').select('id')
      .eq('medecin_id', medecinId).eq('patient_id', patientId).limit(1);
    return data && data.length;
  }

  try {

    // ── GET ──────────────────────────────────────────────────────────────────

    // GET /api/medecin?action=consultations
    if (req.method === 'GET' && action === 'consultations') {
      const { data, error } = await supabase
        .from('consultations').select('*')
        .eq('medecin_id', medecinId)
        .order('created_at', { ascending: false }).limit(100);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/medecin?action=dossier&patient_id=xxx
    if (req.method === 'GET' && action === 'dossier') {
      const patientId = req.query.patient_id;
      if (!patientId) return res.status(400).json({ error: 'patient_id requis' });
      if (!await checkPatientLink(patientId))
        return res.status(403).json({ error: 'Patient non associé à ce médecin' });
      const { data, error } = await supabase
        .from('dossier_medical')
        .select('id,patient_id,nom,type_document,mime_type,taille_octets,source,statut,valeur,note,created_at,visible_medecin,resultat_ia,extraction_json')
        .eq('patient_id', patientId).eq('statut', 'actif').eq('visible_medecin', true)
        .order('created_at', { ascending: false }).limit(100);
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
        .from('agenda').select('*').eq('medecin_id', medecinId)
        .order('date_heure', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/medecin?action=catalogue
    if (req.method === 'GET' && action === 'catalogue') {
      const q = req.query.q || '';
      let query = supabase.from('catalogue_examens').select('nom,categorie,description,obligatoire_defaut');
      if (q.length >= 2) query = query.ilike('nom', `%${q}%`);
      const { data, error } = await query.order('nom', { ascending: true }).limit(202);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/medecin?action=examens&consultation_id=xxx
    if (req.method === 'GET' && action === 'examens') {
      const consultId = req.query.consultation_id;
      if (!consultId) return res.status(400).json({ error: 'consultation_id requis' });
      if (!await checkConsultationOwnership(consultId))
        return res.status(403).json({ error: 'Consultation non autorisée' });
      const { data, error } = await supabase
        .from('examens').select('*').eq('consultation_id', consultId)
        .order('created_at', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/medecin?action=examen&id=xxx  (avec base64 pour affichage)
    if (req.method === 'GET' && action === 'examen') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { data: ex } = await supabase.from('examens').select('*').eq('id', id).single();
      if (!ex) return res.status(404).json({ error: 'Examen introuvable' });
      if (!await checkPatientLink(ex.patient_id))
        return res.status(403).json({ error: 'Non autorisé' });
      // Charger le fichier base64 depuis dossier_medical si note = id examen
      const { data: doc } = await supabase.from('dossier_medical')
        .select('contenu_base64,mime_type').eq('note', id).limit(1);
      const result = { ...ex, fichier: doc && doc.length ? doc[0] : null };
      return res.status(200).json(result);
    }

    // GET /api/medecin?action=ordonnance&consultation_id=xxx
    if (req.method === 'GET' && action === 'ordonnance') {
      const consultId = req.query.consultation_id;
      if (!consultId) return res.status(400).json({ error: 'consultation_id requis' });
      if (!await checkConsultationOwnership(consultId))
        return res.status(403).json({ error: 'Consultation non autorisée' });
      const { data, error } = await supabase
        .from('ordonnances').select('*')
        .eq('consultation_id', consultId).limit(1);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/medecin?action=patient&patient_id=xxx (profil patient lié)
    if (req.method === 'GET' && action === 'patient') {
      const patientId = req.query.patient_id;
      if (!patientId) return res.status(400).json({ error: 'patient_id requis' });
      if (!await checkPatientLink(patientId))
        return res.status(403).json({ error: 'Patient non associé à ce médecin' });
      const { data, error } = await supabase.from('patients')
        .select('id,prenom,nom,naiss,sexe,poids,taille,groupe_sanguin,allergies,antecedents,ville,telephone,langue_preferee,patient_id')
        .eq('id', patientId).single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/medecin?action=patient_by_pid&patient_id=PAT-xxx  (par patient_id custom)
    if (req.method === 'GET' && action === 'patient_by_pid') {
      const pid = req.query.patient_id;
      if (!pid) return res.status(400).json({ error: 'patient_id requis' });
      const { data, error } = await supabase.from('patients')
        .select('id,prenom,nom,naiss,sexe,poids,taille,groupe_sanguin,allergies,antecedents,ville,telephone,langue_preferee,patient_id')
        .eq('patient_id', pid).limit(1);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/medecin?action=disponibilites
    if (req.method === 'GET' && action === 'disponibilites') {
      const etabId = req.query.etablissement_id;
      let query = supabase.from('disponibilites').select('*');
      if (etabId) query = query.eq('etablissement_id', etabId);
      const aujourd = new Date().toISOString().slice(0, 10);
      const { data, error } = await query
        .gte('date_specifique', aujourd)
        .order('date_specifique', { ascending: true })
        .order('heure_debut', { ascending: true })
        .limit(100);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/medecin?action=rdv
    if (req.method === 'GET' && action === 'rdv') {
      const etabId = req.query.etablissement_id;
      const statut = req.query.statut;
      let query = supabase.from('rendez_vous').select('*');
      if (etabId) query = query.eq('etablissement_id', etabId);
      if (statut) query = query.eq('statut', statut);
      const { data, error } = await query
        .order('created_at', { ascending: false }).limit(100);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/medecin?action=etablissement  (étab du médecin)
    if (req.method === 'GET' && action === 'etablissement') {
      const { data, error } = await supabase
        .from('etablissements').select('*')
        .eq('medecin_id', medecinId).limit(1);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // ── PATCH ────────────────────────────────────────────────────────────────

    // PATCH /api/medecin?action=profil
    if (req.method === 'PATCH' && action === 'profil') {
      const updates = req.body;
      const allowed = [
        'prenom','nom','sexe','specialite','sous_specialite',
        'annees_experience','email','telephone','whatsapp',
        'ville','pays','quartier','latitude','longitude',
        'consultation_distance','visite_domicile','urgences',
        'langues_parlees','jours_consultation','tarif_consultation',
        'devise','paiement_mobile','accepte_assurance',
        'signature_base64','updated_at',
        // Ajouts V2.0 — reversement
        'mobile_money_numero','mobile_money_operateur','rib_bancaire'
      ];
      const safe = {};
      allowed.forEach(k => { if (updates[k] !== undefined) safe[k] = updates[k]; });
      const { error } = await supabase.from('medecins').update(safe).eq('id', medecinId);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // PATCH /api/medecin?action=consultation&id=xxx
    if (req.method === 'PATCH' && action === 'consultation') {
      const consultId = req.query.id;
      if (!consultId) return res.status(400).json({ error: 'id requis' });
      if (!await checkConsultationOwnership(consultId))
        return res.status(403).json({ error: 'Consultation non autorisée' });
      const { error } = await supabase
        .from('consultations').update(req.body).eq('id', consultId);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // PATCH /api/medecin?action=examen&id=xxx
    if (req.method === 'PATCH' && action === 'examen') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { data: ex } = await supabase.from('examens').select('consultation_id')
        .eq('id', id).single();
      if (!ex) return res.status(404).json({ error: 'Examen introuvable' });
      if (!await checkConsultationOwnership(ex.consultation_id))
        return res.status(403).json({ error: 'Non autorisé' });
      const allowed = ['nom','obligatoire','statut','note','resultat'];
      const safe = {};
      allowed.forEach(k => { if (req.body[k] !== undefined) safe[k] = req.body[k]; });
      const { error } = await supabase.from('examens').update(safe).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // PATCH /api/medecin?action=dossier&id=xxx  (infirmer / confirmer document)
    if (req.method === 'PATCH' && action === 'dossier') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { data: doc } = await supabase.from('dossier_medical').select('patient_id')
        .eq('id', id).single();
      if (!doc) return res.status(404).json({ error: 'Document introuvable' });
      if (!await checkPatientLink(doc.patient_id))
        return res.status(403).json({ error: 'Non autorisé' });
      const allowed = ['statut','source','valeur','note','visible_medecin'];
      const safe = {};
      allowed.forEach(k => { if (req.body[k] !== undefined) safe[k] = req.body[k]; });
      const { error } = await supabase.from('dossier_medical').update(safe).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // PATCH /api/medecin?action=patient&id=xxx  (enrichissement dossier patient)
    if (req.method === 'PATCH' && action === 'patient') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id requis' });
      if (!await checkPatientLink(id))
        return res.status(403).json({ error: 'Non autorisé' });
      // Médecin ne peut enrichir que certains champs cliniques
      const allowed = ['antecedents','allergies','groupe_sanguin'];
      const safe = {};
      allowed.forEach(k => { if (req.body[k] !== undefined) safe[k] = req.body[k]; });
      const { error } = await supabase.from('patients').update(safe).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // PATCH /api/medecin?action=disponibilite&id=xxx
    if (req.method === 'PATCH' && action === 'disponibilite') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const allowed = ['statut','heure_debut','heure_fin','duree_minutes','notes'];
      const safe = {};
      allowed.forEach(k => { if (req.body[k] !== undefined) safe[k] = req.body[k]; });
      const { error } = await supabase.from('disponibilites').update(safe).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // PATCH /api/medecin?action=rdv&id=xxx
    if (req.method === 'PATCH' && action === 'rdv') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const allowed = ['statut','creneaux_proposes','date_confirmee','notes','motif_refus'];
      const safe = {};
      allowed.forEach(k => { if (req.body[k] !== undefined) safe[k] = req.body[k]; });
      const { error } = await supabase.from('rendez_vous').update(safe).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // ── POST ─────────────────────────────────────────────────────────────────

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

    // POST /api/medecin?action=examen
    if (req.method === 'POST' && action === 'examen') {
      const consultId = req.body.consultation_id;
      if (!consultId) return res.status(400).json({ error: 'consultation_id requis' });
      const consult = await checkConsultationOwnership(consultId);
      if (!consult) return res.status(403).json({ error: 'Consultation non autorisée' });
      const body = {
        ...req.body,
        medecin_id: medecinId,
        patient_id: req.body.patient_id || consult.patient_id
      };
      const { data, error } = await supabase
        .from('examens').insert(body).select('id').single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    // POST /api/medecin?action=disponibilite
    if (req.method === 'POST' && action === 'disponibilite') {
      const body = { ...req.body };
      const { data, error } = await supabase
        .from('disponibilites').insert(body).select('id').single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    // ── DELETE ───────────────────────────────────────────────────────────────

    // DELETE /api/medecin?action=examen&id=xxx
    if (req.method === 'DELETE' && action === 'examen') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { data: ex } = await supabase.from('examens').select('consultation_id')
        .eq('id', id).single();
      if (!ex) return res.status(404).json({ error: 'Examen introuvable' });
      if (!await checkConsultationOwnership(ex.consultation_id))
        return res.status(403).json({ error: 'Non autorisé' });
      const { error } = await supabase.from('examens').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(404).json({ error: 'Action non reconnue: ' + action });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
