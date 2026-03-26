const bcrypt = require('bcryptjs');
const prisma = require('../utils/prismaClient');
const { signToken } = require('../utils/jwt');

async function login(email, password) {
  // Fetch only the fields we need — passwordHash is fetched separately so it
  // never ends up on the safeUser object returned in the response, and the full
  // user row (which includes the hash) is never held in memory beyond this call.
  const userWithHash = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true, passwordHash: true },
  });
  if (!userWithHash || !userWithHash.isActive) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }
  const valid = await bcrypt.compare(password, userWithHash.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }
  const token = signToken({ userId: userWithHash.id, role: userWithHash.role });
  const { passwordHash, ...safeUser } = userWithHash;
  return { token, user: safeUser };
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

module.exports = { login, hashPassword };
