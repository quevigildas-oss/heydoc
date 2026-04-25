// api/_lib/jwt.js
// Helpers JWT — signature et vérification des tokens

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRATION = '24h';

function signerToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRATION });
}

function verifierToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signerToken, verifierToken };
