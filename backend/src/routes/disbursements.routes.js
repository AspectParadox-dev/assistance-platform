const { Router } = require('express');
const ctrl = require('../controllers/disbursements.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { body } = require('express-validator');

const VALID_DISBURSEMENT_STATUSES = ['SCHEDULED', 'PAID', 'CANCELLED'];

const router = Router();
const appRouter = Router({ mergeParams: true });

// Top-level disbursements list
router.get('/', authenticate, authorize('TREASURER', 'ADMIN', 'PRESIDENT'), ctrl.list);
router.get('/:id', authenticate, authorize('TREASURER', 'ADMIN', 'PRESIDENT'), ctrl.getById);
router.patch('/:id', authenticate, authorize('TREASURER', 'ADMIN'),
  validate([
    body('status').optional().isIn(VALID_DISBURSEMENT_STATUSES).withMessage(`Status must be one of: ${VALID_DISBURSEMENT_STATUSES.join(', ')}`),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  ]),
  ctrl.update
);

// Nested under applications
appRouter.get('/', authenticate, authorize('TREASURER', 'ADMIN', 'PRESIDENT'), ctrl.list);
appRouter.post('/', authenticate, authorize('TREASURER', 'ADMIN'),
  validate([
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('method').isIn(['CHECK', 'ZELLE', 'ACH', 'CASH', 'ONLINE', 'OTHER']).withMessage('Invalid payment method'),
    body('scheduledDate').isISO8601().withMessage('scheduledDate must be a valid date'),
  ]),
  ctrl.create
);

module.exports = { disbursementsRouter: router, appDisbursementsRouter: appRouter };
