// api/_middleware/auth.js
// Vérifie le JWT sur chaque requête protégée

const { verifierToken } = require('../_lib/jwt');

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = verifierToken(token);
    req.user = decoded; // { id, role, email }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

module.exports = authMiddleware;
