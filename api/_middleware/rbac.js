// api/_middleware/rbac.js
// Contrôle d'accès basé sur les rôles

function rbacPatient(req, res, next) {
  if (req.user && req.user.role === 'patient') return next();
  return res.status(403).json({ error: 'Accès réservé aux patients' });
}

function rbacMedecin(req, res, next) {
  if (req.user && req.user.role === 'medecin') return next();
  return res.status(403).json({ error: 'Accès réservé aux médecins' });
}

function rbacAny(req, res, next) {
  if (req.user) return next();
  return res.status(403).json({ error: 'Accès non autorisé' });
}

module.exports = { rbacPatient, rbacMedecin, rbacAny };
