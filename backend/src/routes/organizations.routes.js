const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { body } = require('express-validator');
const controller = require('../controllers/organizations.controller');

const router = Router();

const adminOnly = [authenticate, authorize('ADMIN')];

// GET /api/organizations/me — get this org's info
router.get('/me', ...adminOnly, controller.get);

// PATCH /api/organizations/me — update this org's name
router.patch('/me', ...adminOnly,
  validate([body('name').notEmpty().withMessage('Organization name is required')]),
  controller.update
);

module.exports = router;
