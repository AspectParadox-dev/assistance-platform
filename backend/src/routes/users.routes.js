const { Router } = require('express');
const ctrl = require('../controllers/users.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { body } = require('express-validator');

const router = Router();

router.get('/', authenticate, authorize('ADMIN'), ctrl.list);
router.post('/', authenticate, authorize('ADMIN'),
  validate([
    body('email').isEmail(),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('role').isIn(['CASE_MANAGER', 'COMPLIANCE_OFFICER', 'PRESIDENT', 'TREASURER', 'ADMIN']),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ]),
  ctrl.create
);
router.patch('/:id', authenticate, authorize('ADMIN'), validate([
  body('email').optional().isEmail().withMessage('Invalid email address'),
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('role').optional().isIn(['CASE_MANAGER', 'COMPLIANCE_OFFICER', 'PRESIDENT', 'TREASURER', 'ADMIN']).withMessage('Invalid role'),
]), ctrl.update);
router.patch('/:id/deactivate', authenticate, authorize('ADMIN'), ctrl.deactivate);

module.exports = router;
