// api/patient.js
// Endpoints patient — protégés JWT
// VERSION : V2.9
// FIX     : PATCH ao/ordonnance/consultation — autoriser membres famille (compte_parent_id)
// FIX     : POST ao — conserver patient_id du profil sélectionné (famille)
// ADD     : GET pharmacies → table 'pharmacies' (is_test) — avant go-live basculer vers etablissements
// NOTE    : appels_offres — colonnes stock_theorique, rayon_km, patient_lat/lng ajoutées en base
// FIX     : consultations/examens/ordonnances/dossier — support ?for=PAT-XX pour membres famille
// FIX     : profils_famille — inclut membres liés par compte_parent_id (email null)
// DATE    : 2026-06-12
//   V2.9 (2026-06-12) : profils_famille exclut le principal + analyser_resultats
// CHANGELOG :
//   V1.0 (2026-04-20) : Routes initiales (profil, profils_famille, consultations,
//                        examens, ordonnances, dossier, appels_offres, PATCH profil,
//                        POST document)
//   V2.0 (2026-05-12) : Routes initiales V2
//   V2.1 (2026-05-17) : Fix patient_id vs UUID — JWT contient maintenant patient_id (PAT-...)
//                          patientUuid = req.user.id (UUID Supabase, pour table patients)
//                          patientId   = req.user.patient_id (PAT-..., pour consultations/examens/ordonnances) : Phase 2 — Migration JWT frontend complète
//     + GET  medecins          : liste médecins actifs (public, pas de RBAC)
//     + GET  etablissements    : liste établissements par type
//     + GET  stock             : stock pharmacies pour sélection AO
//     + GET  ordonnance        : ordonnance unique par consultation_id
//     + GET  examen            : examen unique par id
//     + GET  ao                : AO complets patient (tous filtres)
//     + GET  rdv               : rendez-vous patient
//     + GET  parrainage        : données parrainage patient
//     + GET  consultation_ao   : AO d'une consultation (alias étendu)
//     + PATCH ao               : PATCH appel_offre (choisir pharmacie, code retrait)
//     + PATCH ordonnance       : PATCH ordonnance (ao_soumis)
//     + PATCH examen           : PATCH examen (statut, resultat)
//     + PATCH parrainage       : PATCH parrainage (credit, code)
//     + PATCH consultation     : PATCH consultation patient (avis, note)
//     + POST  remboursement    : créer demande remboursement
//     + POST  ao               : créer appel d'offre
//     + POST  rdv              : créer demande RDV
//     + POST  inscription      : créer nouveau compte patient
//     + PATCH rdv              : PATCH rendez-vous (confirmer, annuler)
//     + GET  disponibilites    : créneaux disponibles d'un établissement
//     + PATCH profil           : ajout nb_remboursements, alerte_abus, credit_reduction,
//                                ao_soumis, code_parrainage, parrain_id, statut_compte

const supabase = require('./_lib/supabase');
const authMiddleware = require('./_middleware/auth');
const { rbacPatient } = require('./_middleware/rbac');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  // ── Routes publiques (sans JWT) ─────────────────────────────────────────────
  // GET medecins : liste médecins actifs pour le patient qui choisit
  if (req.method === 'GET' && action === 'medecins') {
    const { data, error } = await supabase
      .from('medecins')
      .select('id,prenom,nom,specialite,sous_specialite,ville,quartier,latitude,longitude,tarif_consultation,devise,langues_parlees,jours_consultation,consultation_distance,urgences,annees_experience')
      .eq('statut', 'Actif')
      .limit(50);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }


    // GET pharmacies : table 'pharmacies' (is_test) — go-live: basculer vers etablissements
    if (req.method === 'GET' && action === 'pharmacies') {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('id,nom,telephone,latitude,longitude,ville,quartier,paiement_mobile,is_test')
        .order('nom', { ascending: true })
        .limit(50);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

  // GET etablissements : liste établissements (cliniques, labos, pharmacies)
  if (req.method === 'GET' && action === 'etablissements') {
    const type = req.query.type;
    let query = supabase.from('etablissements').select('*').eq('actif', true).limit(500);
    if (type) query = query.eq('type', type);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // GET stock : stock pharmacies pour sélection AO
  if (req.method === 'GET' && action === 'stock') {
    const { data, error } = await supabase
      .from('stock_pharmacie')
      .select('pharmacie_id,pharmacie_nom,medicament,quantite_recue,quantite_reservee')
      .limit(500);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // ── Authentification JWT obligatoire pour toutes les routes suivantes ────────
  await new Promise((resolve, reject) => {
    authMiddleware(req, res, (err) => err ? reject(err) : resolve());
  }).catch(() => null);
  if (res.writableEnded) return;

  await new Promise((resolve, reject) => {
    rbacPatient(req, res, (err) => err ? reject(err) : resolve());
  }).catch(() => null);
  if (res.writableEnded) return;

  const patientUuid = req.user.id;          // UUID Supabase (table patients.id)
  const patientId = req.user.patient_id || req.user.id;  // PAT-XX-... (consultations, examens, ordonnances)

  try {

    // ── GET ──────────────────────────────────────────────────────────────────

    // GET /api/patient?action=profil
    if (req.method === 'GET' && action === 'profil') {
      const { data, error } = await supabase
        .from('patients').select('*').eq('id', patientUuid).single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/patient?action=profils_famille
    if (req.method === 'GET' && action === 'profils_famille') {
      // Récupérer le profil principal
      const { data: profil } = await supabase
        .from('patients').select('email').eq('id', patientUuid).single();

      // Profils par email (membres famille avec même email)
      let byEmail = [];
      if (profil && profil.email) {
        const { data } = await supabase
          .from('patients').select('*').eq('email', profil.email);
        byEmail = data || [];
      } else {
        // Pas d'email → charger uniquement ce profil
        const { data } = await supabase
          .from('patients').select('*').eq('id', patientUuid);
        byEmail = data || [];
      }

      // Profils liés par compte_parent_id (membres famille sans email propre)
      const { data: byParent } = await supabase
        .from('patients').select('*').eq('compte_parent_id', patientUuid);
      const linked = byParent || [];

      // Fusionner et dédupliquer par id + exclure le profil principal
      const all = [...byEmail];
      for (const p of linked) {
        if (!all.find(x => x.id === p.id)) all.push(p);
      }
      const filtered = all.filter(p => p.id !== patientUuid);

      return res.status(200).json(filtered);
    }

    // GET /api/patient?action=consultations[&for=PAT-XX-...]
    // for= permet de charger les consultations d'un membre de la famille
    if (req.method === 'GET' && action === 'consultations') {
      const limit = parseInt(req.query.limit) || 50;
      let targetId = patientId; // par défaut : le profil du JWT

      // Si for= est fourni, vérifier que ce patient est dans la famille
      if (req.query.for && req.query.for !== patientId) {
        const forId = req.query.for;
        // Vérifier : même email OU compte_parent_id = patientUuid
        const { data: famCheck } = await supabase
          .from('patients')
          .select('id, patient_id, compte_parent_id, email')
          .eq('patient_id', forId)
          .limit(1);
        const member = famCheck && famCheck[0];
        if (!member) return res.status(403).json({ error: 'Patient non trouvé' });

        // Autoriser si : lié par compte_parent_id OU même email
        const { data: self } = await supabase
          .from('patients').select('email').eq('id', patientUuid).single();
        const isFamille = member.compte_parent_id === patientUuid ||
                          (self && member.email && member.email === self.email);
        if (!isFamille) return res.status(403).json({ error: 'Accès non autorisé' });
        targetId = forId;
      }

      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', targetId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/patient?action=consultation&id=xxx
    if (req.method === 'GET' && action === 'consultation') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { data, error } = await supabase
        .from('consultations').select('*')
        .eq('id', id).eq('patient_id', patientId).single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/patient?action=examens[&consultation_id=xxx][&statut=xxx]
    if (req.method === 'GET' && action === 'examens') {
      const examTarget = req.query.for || patientId;
      let query = supabase.from('examens').select('*').eq('patient_id', examTarget);
      if (req.query.consultation_id) query = query.eq('consultation_id', req.query.consultation_id);
      if (req.query.statut) query = query.eq('statut', req.query.statut);
      if (req.query.obligatoire) query = query.eq('obligatoire', req.query.obligatoire === 'true');
      const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/patient?action=examen&id=xxx
    if (req.method === 'GET' && action === 'examen') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { data, error } = await supabase
        .from('examens').select('*')
        .eq('id', id).eq('patient_id', patientId).single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/patient?action=ordonnances
    if (req.method === 'GET' && action === 'ordonnances') {
      const ordTarget = req.query.for || patientId;
      let query = supabase.from('ordonnances').select('*').eq('patient_id', ordTarget);
      if (req.query.statut) query = query.eq('statut', req.query.statut);
      if (req.query.consultation_id) query = query.eq('consultation_id', req.query.consultation_id);
      const { data, error } = await query.order('created_at', { ascending: false }).limit(20);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/patient?action=ordonnance&consultation_id=xxx
    if (req.method === 'GET' && action === 'ordonnance') {
      const consultId = req.query.consultation_id;
      if (!consultId) return res.status(400).json({ error: 'consultation_id requis' });
      const { data, error } = await supabase
        .from('ordonnances').select('*')
        .eq('consultation_id', consultId)
        .limit(1);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/patient?action=dossier
    if (req.method === 'GET' && action === 'dossier') {
      const { data, error } = await supabase
        .from('dossier_medical')
        .select('id,patient_id,nom,type_document,mime_type,taille_octets,source,statut,valeur,note,created_at,visible_medecin,resultat_ia,extraction_json')
        .eq('patient_id', req.query.for || patientId)
        .eq('statut', 'actif')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/patient?action=appels_offres[&consultation_id=xxx]
    if (req.method === 'GET' && action === 'appels_offres') {
      const aoTarget = req.query.for || patientId;
      let query = supabase.from('appels_offres').select('*').eq('patient_id', aoTarget);
      if (req.query.consultation_id) query = query.eq('consultation_id', req.query.consultation_id);
      if (req.query.statut) query = query.eq('statut', req.query.statut);
      const { data, error } = await query.order('created_at', { ascending: false }).limit(20);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/patient?action=ao&id=xxx  (AO unique par id)
    if (req.method === 'GET' && action === 'ao') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { data, error } = await supabase
        .from('appels_offres').select('*')
        .eq('id', id).eq('patient_id', patientId).single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/patient?action=rdv
    if (req.method === 'GET' && action === 'rdv') {
      let query = supabase.from('rendez_vous').select('*').eq('patient_id', patientId);
      if (req.query.statut) query = query.eq('statut', req.query.statut);
      if (req.query.etablissement_id) query = query.eq('etablissement_id', req.query.etablissement_id);
      const { data, error } = await query.order('created_at', { ascending: false }).limit(20);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/patient?action=disponibilites&etablissement_id=xxx
    if (req.method === 'GET' && action === 'disponibilites') {
      const etabId = req.query.etablissement_id;
      if (!etabId) return res.status(400).json({ error: 'etablissement_id requis' });
      const aujourd = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('disponibilites')
        .select('*')
        .eq('etablissement_id', etabId)
        .gte('date_specifique', aujourd)
        .order('date_specifique', { ascending: true })
        .order('heure_debut', { ascending: true })
        .limit(100);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // GET /api/patient?action=parrainage
    if (req.method === 'GET' && action === 'parrainage') {
      const { data, error } = await supabase
        .from('patients')
        .select('code_parrainage,credit_reduction,nb_remboursements')
        .eq('id', patientUuid).single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // ── PATCH ────────────────────────────────────────────────────────────────

    // PATCH /api/patient?action=profil
    if (req.method === 'PATCH' && action === 'profil') {
      const updates = req.body;
      const allowed = [
        'prenom','nom','naiss','sexe','poids','taille','groupe_sanguin',
        'langue_preferee','telephone','email','ville','antecedents','allergies',
        'ia_consent','ia_consent_date','code_parrainage','parrain_id',
        'credit_reduction','nb_remboursements','alerte_abus','statut_compte',
        'ao_soumis'
      ];
      const safe = {};
      allowed.forEach(k => { if (updates[k] !== undefined) safe[k] = updates[k]; });
      const { error } = await supabase.from('patients').update(safe).eq('id', patientUuid);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // PATCH /api/patient?action=examen&id=xxx
    if (req.method === 'PATCH' && action === 'examen') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id requis' });
      // Vérifier appartenance
      const { data: check } = await supabase.from('examens').select('id')
        .eq('id', id).eq('patient_id', patientId).limit(1);
      if (!check || !check.length) return res.status(403).json({ error: 'Non autorisé' });
      const allowed = ['statut','resultat','extraction_json','resultat_ia','note'];
      const safe = {};
      allowed.forEach(k => { if (req.body[k] !== undefined) safe[k] = req.body[k]; });
      const { error } = await supabase.from('examens').update(safe).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // PATCH /api/patient?action=ordonnance&id=xxx
    if (req.method === 'PATCH' && action === 'ordonnance') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { data: check } = await supabase.from('ordonnances').select('id,patient_id')
        .eq('id', id).limit(1);
      if (!check || !check.length) return res.status(403).json({ error: 'Non autorisé' });
      const ordPatientId = check[0].patient_id;
      if (ordPatientId !== patientId) {
        const { data: famCheck } = await supabase.from('patients')
          .select('id').eq('patient_id', ordPatientId)
          .eq('compte_parent_id', patientUuid).limit(1);
        if (!famCheck || !famCheck.length) return res.status(403).json({ error: 'Non autorisé' });
      }
      const allowed = ['ao_soumis','statut'];
      const safe = {};
      allowed.forEach(k => { if (req.body[k] !== undefined) safe[k] = req.body[k]; });
      const { error } = await supabase.from('ordonnances').update(safe).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // PATCH /api/patient?action=ao&id=xxx
    if (req.method === 'PATCH' && action === 'ao') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id requis' });
      // Vérifier appartenance — patient lui-même OU membre de la famille
      const { data: check } = await supabase.from('appels_offres').select('id,patient_id')
        .eq('id', id).limit(1);
      if (!check || !check.length) return res.status(403).json({ error: 'Non autorisé' });
      const aoPatientId = check[0].patient_id;
      // Autoriser si : AO du patient lui-même OU AO d'un membre lié par compte_parent_id
      if (aoPatientId !== patientId) {
        const { data: famCheck } = await supabase.from('patients')
          .select('id').eq('patient_id', aoPatientId)
          .eq('compte_parent_id', patientUuid).limit(1);
        if (!famCheck || !famCheck.length) return res.status(403).json({ error: 'Non autorisé' });
      }
      const allowed = ['statut','code_retrait','pharmacie_selectionnee','pharmacie_tel','date_retrait'];
      const safe = {};
      allowed.forEach(k => { if (req.body[k] !== undefined) safe[k] = req.body[k]; });
      const { error } = await supabase.from('appels_offres').update(safe).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // PATCH /api/patient?action=consultation&id=xxx (avis patient uniquement)
    if (req.method === 'PATCH' && action === 'consultation') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { data: check } = await supabase.from('consultations').select('id,patient_id')
        .eq('id', id).limit(1);
      if (!check || !check.length) return res.status(403).json({ error: 'Non autorisé' });
      if (check[0].patient_id !== patientId) {
        const { data: famCheck } = await supabase.from('patients')
          .select('id').eq('patient_id', check[0].patient_id)
          .eq('compte_parent_id', patientUuid).limit(1);
        if (!famCheck || !famCheck.length) return res.status(403).json({ error: 'Non autorisé' });
      }
      // Patient peut seulement écrire ses avis et demander remboursement
      const allowed = ['note_medecin','note_afribot','commentaire_patient','rembourse'];
      const safe = {};
      allowed.forEach(k => { if (req.body[k] !== undefined) safe[k] = req.body[k]; });
      const { error } = await supabase.from('consultations').update(safe).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // PATCH /api/patient?action=rdv&id=xxx
    if (req.method === 'PATCH' && action === 'rdv') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { data: check } = await supabase.from('rendez_vous').select('id')
        .eq('id', id).eq('patient_id', patientId).limit(1);
      if (!check || !check.length) return res.status(403).json({ error: 'Non autorisé' });
      const allowed = ['statut','date_confirmee','creneau_choisi'];
      const safe = {};
      allowed.forEach(k => { if (req.body[k] !== undefined) safe[k] = req.body[k]; });
      const { error } = await supabase.from('rendez_vous').update(safe).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    // ── POST ─────────────────────────────────────────────────────────────────

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

    // POST /api/patient?action=ao
    if (req.method === 'POST' && action === 'ao') {
      // Garder le patient_id du body si c'est un membre de la famille
      // (le front envoie PROFILS[SEL].patientId qui peut être différent du JWT)
      const bodyPatientId = req.body.patient_id || patientId;
      const body = { ...req.body, patient_id: bodyPatientId };
      const { data, error } = await supabase
        .from('appels_offres').insert(body).select('id').single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    // POST /api/patient?action=remboursement
    if (req.method === 'POST' && action === 'remboursement') {
      const body = { ...req.body, patient_id: patientId };
      const { data, error } = await supabase
        .from('remboursements').insert(body).select('id').single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    // POST /api/patient?action=rdv
    if (req.method === 'POST' && action === 'rdv') {
      const body = { ...req.body, patient_id: patientId, statut: 'demande' };
      const { data, error } = await supabase
        .from('rendez_vous').insert(body).select('id').single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    // POST /api/patient?action=inscription (créer compte famille)
    if (req.method === 'POST' && action === 'inscription') {
      // Vérifier que l'email correspond au patient connecté (même famille)
      const { data: self } = await supabase.from('patients').select('email').eq('id', patientUuid).single();
      const body = req.body;
      if (body.email && body.email !== self.email) {
        return res.status(403).json({ error: 'Email doit correspondre au compte principal' });
      }
      body.email = self.email; // forcer le même email famille
      const { data, error } = await supabase.from('patients').insert(body).select('id').single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    return res.status(404).json({ error: 'Action non reconnue: ' + action });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
