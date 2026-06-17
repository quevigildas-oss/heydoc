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
      .select('id,prenom,nom,specialite,sous_specialite,ville,quartier,latitude,longitude,tarif_consultation,devise,langues_parlees,jours_consultation,consultation_distance,urgences,annees_experience,nom_complet,signature_base64')
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
      // Utiliser SERVICE_ROLE_KEY pour bypasser RLS — lecture cross-patient nécessaire
      const SUPA_URL = process.env.SUPABASE_URL;
      const SUPA_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;

      // 1. Récupérer le profil principal pour avoir son UUID exact
      const profilRes = await fetch(
        `${SUPA_URL}/rest/v1/patients?id=eq.${patientUuid}&select=id,email&limit=1`,
        { headers: { 'apikey': SUPA_SRK, 'Authorization': `Bearer ${SUPA_SRK}` } }
      );
      const profilRows = await profilRes.json();
      const profil = Array.isArray(profilRows) ? profilRows[0] : null;
      const parentUuid = profil ? profil.id : patientUuid;

      // 2. Chercher les membres famille par compte_parent_id (UUID exact)
      const familleRes = await fetch(
        `${SUPA_URL}/rest/v1/patients?compte_parent_id=eq.${parentUuid}&select=*`,
        { headers: { 'apikey': SUPA_SRK, 'Authorization': `Bearer ${SUPA_SRK}` } }
      );
      let membres = await familleRes.json();
      if (!Array.isArray(membres)) membres = [];

      // 3. Si pas de membres par compte_parent_id, chercher par email (fallback)
      if (membres.length === 0 && profil && profil.email) {
        const emailRes = await fetch(
          `${SUPA_URL}/rest/v1/patients?email=eq.${encodeURIComponent(profil.email)}&select=*`,
          { headers: { 'apikey': SUPA_SRK, 'Authorization': `Bearer ${SUPA_SRK}` } }
        );
        const byEmail = await emailRes.json();
        if (Array.isArray(byEmail)) {
          membres = byEmail.filter(p => p.id !== parentUuid);
        }
      }

      // Exclure le profil principal (sécurité supplémentaire)
      membres = membres.filter(p => p.id !== parentUuid);

      console.log('profils_famille — parentUuid:', parentUuid, '| membres:', membres.length);
      return res.status(200).json(membres);
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
      const consultationId = req.query.consultation_id;
      if (!id && !consultationId) return res.status(400).json({ error: 'id ou consultation_id requis' });
      // FIX 2026-06-17 : le front envoie AO_SESSION_ID (un consultation_id, pas
      // l'id PK de l'ordonnance) sous le paramètre id — confirmé par audit, ce
      // PATCH échouait systématiquement en 403 (aucune ligne trouvée par id).
      // On filtre par consultation_id si fourni, sinon on garde le filtre par id
      // pour compatibilité avec un éventuel appelant qui utiliserait le vrai id.
      const filterCol = consultationId ? 'consultation_id' : 'id';
      const filterVal = consultationId || id;
      const { data: check } = await supabase.from('ordonnances').select('id,patient_id')
        .eq(filterCol, filterVal).limit(1);
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
      const { error } = await supabase.from('ordonnances').update(safe).eq(filterCol, filterVal);
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
      // SERVICE_ROLE_KEY pour bypasser RLS — sinon update silencieux 0 lignes
      const { createClient } = require('@supabase/supabase-js');
      const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const { error, data: updated } = await supabaseAdmin.from('appels_offres').update(safe).eq('id', id).select('id');
      if (error) return res.status(500).json({ error: error.message });
      console.log('PATCH ao:', id, '→', safe.statut, '| lignes:', updated?.length||0);
      return res.status(200).json({ ok: true, updated: updated?.length||0 });
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


    // POST /api/patient?action=analyser_resultats
    // Analyse IA feuille labo + upload Storage + PATCH toutes lignes exam
    if (req.method === 'POST' && action === 'analyser_resultats') {
      const { contenu_base64, mime_type, examens, consultation_id, sauvegarder } = req.body;
      if (!contenu_base64 || !mime_type || !examens || !examens.length) {
        return res.status(400).json({ error: 'contenu_base64, mime_type et examens requis' });
      }

      const targetPatientId = req.query.for || patientId;
      const { data: consult } = await supabase.from('consultations').select('id')
        .eq('id', consultation_id).eq('patient_id', targetPatientId).single();
      if (!consult) return res.status(403).json({ error: 'Consultation non trouvée' });

      const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
      if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'ANTHROPIC_KEY manquant — ajouter dans Vercel env vars heydoc' });

      const SUPA_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;

      // Construire prompt
      const examensList = examens.map(e => `- ${e.type_examen} (${e.obligatoire ? 'OBL' : 'REC'})`).join('\n');
      const prompt = `Tu es un expert en analyses biologiques africaines (Côte d'Ivoire).
Analyse ce document de résultats de laboratoire et identifie les examens prescrits.

EXAMENS PRESCRITS :
${examensList}

Pour chaque examen prescrit, détermine :
1. S'il est présent dans le document (trouve: true/false)
2. La valeur exacte extraite du document (valeur)
3. L'interprétation clinique (interpretation) — OBLIGATOIREMENT l'une de ces 4 valeurs exactes :
   - "Normal"     → résultat dans les valeurs de référence attendues
   - "Anormal"    → résultat hors normes, test positif, présence d'agent pathogène, valeur basse ou élevée
   - "Critique"   → résultat sévèrement anormal nécessitant une prise en charge urgente
   - "En attente" → résultat incomplet, illisible ou non interprétable

Réponds UNIQUEMENT avec ce JSON valide, sans texte avant ou après :
{
  "matches": [
    {
      "type_examen": "nom exact de l'examen prescrit (recopié)",
      "trouve": true,
      "valeur": "valeur ou résultat extrait, ou null si absent",
      "interpretation": "Normal|Anormal|Critique|En attente"
    }
  ],
  "labo": "nom du laboratoire si visible, sinon null",
  "date_document": "date du document si visible, sinon null"
}

RÈGLES ABSOLUES :
- Ne jamais inventer un résultat absent du document
- Si document illisible pour un examen → trouve: false
- Matching sémantique : NFS = Numération Formule Sanguine = Hémogramme
- TDR Paludisme = Test rapide Plasmodium = Test antigénique paludisme
- GE = Goutte épaisse = Frottis sanguin paludisme
- "interpretation" doit être EXACTEMENT l'un des 4 mots ci-dessus, rien d'autre`;

      const messageContent = [];
      if (mime_type === 'application/pdf') {
        messageContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: contenu_base64 } });
      } else {
        messageContent.push({ type: 'image', source: { type: 'base64', media_type: mime_type, data: contenu_base64 } });
      }
      messageContent.push({ type: 'text', text: prompt });

      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, messages: [{ role: 'user', content: messageContent }] })
      });
      const claudeData = await claudeRes.json();
      const rawText = claudeData?.content?.[0]?.text || '';

      let matches = [], laboNom = null, dateDoc = null;
      try {
        const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
        matches = parsed.matches || [];
        laboNom = parsed.labo || null;
        dateDoc = parsed.date_document || null;
      } catch(ep) {
        console.error('Parse IA err:', ep.message, rawText.substring(0,200));
        return res.status(200).json({ matches: [], error: 'Extraction IA échouée', raw: rawText.substring(0,200) });
      }

      // Upload Supabase Storage
      let pdfUrl = null;
      if (sauvegarder && SUPA_SRK) {
        try {
          const ext = mime_type === 'application/pdf' ? 'pdf' : 'jpg';
          const storagePath = `${targetPatientId}/${consultation_id}/${Date.now()}.${ext}`;
          const buf = Buffer.from(contenu_base64, 'base64');
          const upRes = await fetch(
            `${process.env.SUPABASE_URL}/storage/v1/object/resultats-labo/${storagePath}`,
            { method: 'POST', headers: { 'apikey': SUPA_SRK, 'Authorization': `Bearer ${SUPA_SRK}`, 'Content-Type': mime_type, 'x-upsert': 'false' }, body: buf }
          );
          if (upRes.ok) {
            pdfUrl = `${process.env.SUPABASE_URL}/storage/v1/object/resultats-labo/${storagePath}`;
            console.log('Storage upload OK:', storagePath);
          } else { console.error('Storage err:', await upRes.text()); }
        } catch(eS) { console.error('Storage exception:', eS.message); }
      }

      const now = new Date().toISOString();

      // PATCH avec client admin (SERVICE_ROLE_KEY) pour bypasser RLS
      const { createClient } = require('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      for (const match of matches) {
        const matched = match.trouve !== undefined ? match.trouve : (match['trouvé'] !== undefined ? match['trouvé'] : false);
        if (!matched) continue;
        const exam = examens.find(e =>
          e.type_examen.toLowerCase().includes(match.type_examen.toLowerCase().substring(0,5)) ||
          match.type_examen.toLowerCase().includes(e.type_examen.toLowerCase().substring(0,5))
        );
        if (exam?.id) {
          const patch = {
            statut: 'resultat_recu',
            resultat: match.valeur || '',
            interpretation: match.interpretation || 'En attente',
            date_resultat: now,
            extraction_json: { type_examen: match.type_examen, valeur: match.valeur, interpretation: match.interpretation, labo: laboNom, extrait_le: now }
          };
          if (pdfUrl) patch.resultat_pdf_url = pdfUrl;
          if (laboNom) patch.labo_nom = laboNom;
          const { error: pe } = await supabaseAdmin.from('examens').update(patch).eq('id', exam.id);
          if (pe) console.error('PATCH err:', exam.type_examen, pe.message);
          else console.log('PATCH OK:', exam.type_examen);
        }
      }
      if (pdfUrl) {
        const { error: pe2 } = await supabaseAdmin.from('examens')
          .update({ resultat_pdf_url: pdfUrl, labo_nom: laboNom || null })
          .eq('consultation_id', consultation_id);
        if (pe2) console.error('PDF URL err:', pe2.message);
        else console.log('PDF URL OK');
      }

      return res.status(200).json({
        matches, labo: laboNom, date_document: dateDoc,
        pdf_url: pdfUrl,
        nb_trouvés: matches.filter(m => m.trouve || m['trouvé']).length,
        nb_total: matches.length
      });
    }


    // GET /api/patient?action=signed_url&path=xxx
    // Génère une URL signée temporaire pour accéder à un fichier Storage
    if (req.method === 'GET' && action === 'signed_url') {
      const filePath = req.query.path;
      if (!filePath) return res.status(400).json({ error: 'path requis' });

      // Vérifier que le fichier appartient au patient (path commence par patient_id)
      const targetPatientId2 = req.query.for || patientId;
      if (!filePath.startsWith(targetPatientId2 + '/')) {
        return res.status(403).json({ error: 'Accès refusé' });
      }

      const SUPA_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
      try {
        const signRes = await fetch(
          `${process.env.SUPABASE_URL}/storage/v1/object/sign/resultats-labo/${filePath}`,
          {
            method: 'POST',
            headers: {
              'apikey': SUPA_SRK,
              'Authorization': `Bearer ${SUPA_SRK}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ expiresIn: 3600 }) // 1 heure
          }
        );
        const signData = await signRes.json();
        if (!signRes.ok) return res.status(500).json({ error: signData.message || 'Erreur signature' });
        const signedUrl = `${process.env.SUPABASE_URL}/storage/v1${signData.signedURL}`;
        return res.status(200).json({ url: signedUrl, expires_in: 3600 });
      } catch (eSign) {
        return res.status(500).json({ error: eSign.message });
      }
    }

    return res.status(404).json({ error: 'Action non reconnue: ' + action });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
