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
  // passwordHash is already stripped by the authenticate middleware.
  res.json(req.user);
}

module.exports = { login, me };
