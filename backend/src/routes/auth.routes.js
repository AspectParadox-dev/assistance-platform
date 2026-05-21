const { Router } = require('express');
const { login, me, googleLogin, verifyEmail, resendVerification } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too Many Requests', message: 'Too many attempts. Please try again in 15 minutes.' },
});

const router = Router();

router.post('/login', loginLimiter, validate([
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
]), login);

router.post('/google', loginLimiter, validate([
  body('credential').notEmpty().withMessage('Google credential is required'),
]), googleLogin);

router.get('/verify-email/:token', verifyEmail);

router.post('/resend-verification', loginLimiter, validate([
  body('email').isEmail().withMessage('Valid email required'),
]), resendVerification);

// TEMP: force-send verification email regardless of verified status — remove after use
router.post('/force-verify-email', async (req, res) => {
  const { email } = req.body;
  const prisma = require('../utils/prismaClient');
  const { signVerificationToken } = require('../utils/jwt');
  const emailService = require('../utils/emailService');
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, firstName: true } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const token = signVerificationToken(user.id);
  const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
  await emailService.sendEmailVerification(user, `${appUrl}/verify-email?token=${token}`);
  res.json({ message: 'Verification email sent.' });
});

router.get('/me', authenticate, me);

module.exports = router;
