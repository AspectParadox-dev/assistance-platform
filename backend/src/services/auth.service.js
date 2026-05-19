const bcrypt = require('bcryptjs');
const prisma = require('../utils/prismaClient');
const { signToken, signVerificationToken, verifyVerificationToken } = require('../utils/jwt');
const emailService = require('../utils/emailService');

// Lazy-load google-auth-library only when GOOGLE_CLIENT_ID is configured
let googleClient;
if (process.env.GOOGLE_CLIENT_ID) {
  try {
    const { OAuth2Client } = require('google-auth-library');
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  } catch {
    console.warn('[auth] google-auth-library not installed — Google Sign-In disabled. Run npm install.');
  }
}

async function login(email, password) {
  const userWithHash = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true, passwordHash: true, emailVerified: true },
  });
  if (!userWithHash || !userWithHash.isActive) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }
  if (!userWithHash.passwordHash) {
    throw Object.assign(new Error('This account uses Google Sign-In. Please use the Google button to sign in.'), { status: 401 });
  }
  const valid = await bcrypt.compare(password, userWithHash.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }
  if (!userWithHash.emailVerified) {
    throw Object.assign(
      new Error('Your email address has not been verified. Check your inbox for the verification link or request a new one.'),
      { status: 403, appCode: 'EMAIL_NOT_VERIFIED' }
    );
  }
  const token = signToken({ userId: userWithHash.id, role: userWithHash.role });
  const { passwordHash, emailVerified, ...safeUser } = userWithHash;
  return { token, user: safeUser };
}

async function googleLogin(credential) {
  if (!googleClient) {
    throw Object.assign(new Error('Google Sign-In is not configured on this server.'), { status: 501 });
  }
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw Object.assign(new Error('Invalid Google credential. Please try again.'), { status: 401 });
  }

  const { sub: googleId, email } = payload;

  // Find by googleId first (already linked), then by email (first-time Google login)
  let user = await prisma.user.findFirst({
    where: { googleId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true, emailVerified: true },
  });

  if (!user) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      throw Object.assign(
        new Error('No staff account found for this Google account. Contact your administrator to create an account.'),
        { status: 403 }
      );
    }
    if (!existing.isActive) {
      throw Object.assign(new Error('This account has been deactivated.'), { status: 401 });
    }
    // Link Google account and mark email verified
    user = await prisma.user.update({
      where: { id: existing.id },
      data: { googleId, emailVerified: true, emailVerificationToken: null },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true, emailVerified: true },
    });
  }

  if (!user.isActive) {
    throw Object.assign(new Error('This account has been deactivated.'), { status: 401 });
  }

  const token = signToken({ userId: user.id, role: user.role });
  const { emailVerified, ...safeUser } = user;
  return { token, user: safeUser };
}

async function sendVerificationEmail(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true },
  });
  if (!user) return;
  const token = signVerificationToken(userId);
  const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationUrl = `${appUrl}/verify-email?token=${token}`;
  await emailService.sendEmailVerification(user, verificationUrl);
}

async function verifyEmail(token) {
  let payload;
  try {
    payload = verifyVerificationToken(token);
  } catch {
    throw Object.assign(new Error('Invalid or expired verification link. Please request a new one.'), { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw Object.assign(new Error('Invalid or expired verification link. Please request a new one.'), { status: 400 });
  }
  if (user.emailVerified) {
    return { message: 'Email verified successfully. You can now sign in.' };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerificationToken: null },
  });
  return { message: 'Email verified successfully. You can now sign in.' };
}

async function findAndSendVerification(email) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isActive: true, emailVerified: true },
  });
  if (user && user.isActive && !user.emailVerified) {
    await sendVerificationEmail(user.id);
  }
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

module.exports = { login, googleLogin, sendVerificationEmail, verifyEmail, findAndSendVerification, hashPassword };
