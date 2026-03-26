const { Router } = require('express');
const ctrl = require('../controllers/decisions.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { body } = require('express-validator');

const INTERNAL = ['CASE_MANAGER', 'COMPLIANCE_OFFICER', 'PRESIDENT', 'TREASURER', 'ADMIN'];

const router = Router({ mergeParams: true });

router.get('/', authenticate, authorize(...INTERNAL), ctrl.list);
router.post('/', authenticate, authorize('PRESIDENT', 'ADMIN'),
  validate([
    body('outcome').isIn(['APPROVED', 'REJECTED', 'PENDING_INFO']).withMessage('Invalid outcome'),
    body('rationale').notEmpty().withMessage('Rationale required'),
    body('approvedAmount').optional().isFloat({ min: 0.01 }).withMessage('Approved amount must be greater than 0'),
  ]),
  ctrl.create
);

module.exports = router;
