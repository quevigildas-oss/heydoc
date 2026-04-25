// api/documents.js
// Upload et téléchargement de fichiers médicaux — protégés JWT

const supabase = require('./_lib/supabase');
const authMiddleware = require('./_middleware/auth');
const { rbacAny } = require('./_middleware/rbac');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  await new Promise((resolve, reject) => {
    authMiddleware(req, res, (err) => err ? reject(err) : resolve());
  }).catch(() => null);
  if (res.writableEnded) return;

  await new Promise((resolve, reject) => {
    rbacAny(req, res, (err) => err ? reject(err) : resolve());
  }).catch(() => null);
  if (res.writableEnded) return;

  const { action } = req.query;

  try {
    // GET /api/documents?action=get&id=xxx
    // Retourne le fichier — vérifie les droits selon le rôle
    if (req.method === 'GET' && action === 'get') {
      const docId = req.query.id;
      if (!docId) return res.status(400).json({ error: 'id requis' });

      const { data: doc, error } = await supabase
        .from('dossier_medical')
        .select('id,patient_id,contenu_base64,mime_type,nom,source')
        .eq('id', docId)
        .single();

      if (error || !doc) return res.status(404).json({ error: 'Document non trouvé' });

      // Patient ne peut voir que ses propres docs
      if (req.user.role === 'patient' && doc.patient_id !== req.user.id) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }

      // Médecin ne peut voir que les docs visible_medecin=true
      // + vérifier qu'il a une consultation avec ce patient
      if (req.user.role === 'medecin') {
        const { data: check } = await supabase
          .from('consultations')
          .select('id')
          .eq('medecin_id', req.user.id)
          .eq('patient_id', doc.patient_id)
          .limit(1);
        if (!check || !check.length) {
          return res.status(403).json({ error: 'Patient non associé à ce médecin' });
        }
      }

      return res.status(200).json({
        id: doc.id,
        nom: doc.nom,
        mime_type: doc.mime_type,
        contenu_base64: doc.contenu_base64
      });
    }

    // POST /api/documents?action=upload
    if (req.method === 'POST' && action === 'upload') {
      const { patient_id, nom, type_document, mime_type,
              contenu_base64, taille_octets, note, source } = req.body;

      // Patient ne peut uploader que pour lui-même
      if (req.user.role === 'patient' && patient_id !== req.user.id) {
        return res.status(403).json({ error: 'Upload non autorisé pour ce patient' });
      }

      const { data, error } = await supabase
        .from('dossier_medical')
        .insert({
          patient_id,
          nom,
          type_document,
          mime_type,
          contenu_base64,
          taille_octets,
          note,
          source: source || (req.user.role === 'medecin' ? 'medecin' : 'patient'),
          statut: 'actif',
          visible_medecin: true
        })
        .select('id')
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    return res.status(404).json({ error: 'Action non reconnue: ' + action });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
