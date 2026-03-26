const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET === 'changeme') {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set to a strong secret in production.');
  } else {
    console.warn('[WARN] JWT_SECRET is not set or is the default "changeme". Set a strong secret before deploying.');
  }
}
const RESOLVED_SECRET = SECRET || 'changeme-dev-only';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(payload) {
  return jwt.sign(payload, RESOLVED_SECRET, { expiresIn: EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, RESOLVED_SECRET);
}

module.exports = { signToken, verifyToken };
