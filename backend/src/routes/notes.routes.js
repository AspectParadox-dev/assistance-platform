const { Router } = require('express');
const ctrl = require('../controllers/notes.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { body } = require('express-validator');

const INTERNAL = ['CASE_MANAGER', 'COMPLIANCE_OFFICER', 'PRESIDENT', 'TREASURER', 'ADMIN'];

const router = Router({ mergeParams: true });

router.get('/', authenticate, authorize(...INTERNAL), ctrl.list);
router.post('/', authenticate, authorize('CASE_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  validate([
    body('content').notEmpty().withMessage('Content required')
      .isLength({ max: 10000 }).withMessage('Note content must not exceed 10,000 characters'),
    body('isInternal').optional()
      .isBoolean().withMessage('isInternal must be a boolean (true or false)'),
  ]),
  ctrl.create
);

module.exports = router;
