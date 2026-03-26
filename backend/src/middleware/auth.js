const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/jwt');
const prisma = require('../utils/prismaClient');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
  }
  try {
    const payload = verifyToken(token);
    // Exclude passwordHash at the DB level — not just by destructuring — so the
    // hash is never fetched from the database at all during auth middleware.
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
    });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found or inactive' });
    }
    req.user = user;
    next();
  } catch (err) {
    // Distinguish "session expired" from "token invalid/tampered" so the frontend
    // can show a contextually correct message (e.g. "Your session has expired,
    // please sign in again" vs a generic auth failure).
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'TokenExpired', message: 'Your session has expired. Please sign in again.' });
    }
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
}

module.exports = { authenticate };
