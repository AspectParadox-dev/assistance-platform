const authService = require('../services/auth.service');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

function me(req, res) {
  res.json(req.user);
}

async function googleLogin(req, res, next) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Bad Request', message: 'credential is required' });
    }
    const result = await authService.googleLogin(credential);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const result = await authService.verifyEmail(req.params.token);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Bad Request', message: 'email is required' });
    }
    await authService.findAndSendVerification(email);
    // Always return the same response — don't reveal whether an account exists
    res.json({ message: 'If an account with that email exists and is unverified, a new verification link has been sent.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me, googleLogin, verifyEmail, resendVerification };
