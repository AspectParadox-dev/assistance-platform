const { Router } = require('express');
const ctrl = require('../controllers/applications.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { body } = require('express-validator');

const { VALID_TRANSITIONS } = require('../utils/statusMachine');
const VALID_STATUSES = Object.keys(VALID_TRANSITIONS);

const INTERNAL = ['CASE_MANAGER', 'COMPLIANCE_OFFICER', 'PRESIDENT', 'TREASURER', 'ADMIN'];

const intakeValidation = [
  body('firstName').notEmpty().isLength({ max: 100 }),
  body('lastName').notEmpty().isLength({ max: 100 }),
  body('email').isEmail().isLength({ max: 254 }),
  body('phone').notEmpty().isLength({ max: 30 }),
  body('address').notEmpty().isLength({ max: 200 }),
  body('city').notEmpty().isLength({ max: 100 }),
  body('state').notEmpty().isLength({ max: 100 }),
  body('zip').notEmpty().isLength({ max: 20 }),
  // toInt()/toFloat() coerce the validated string into a number so the service
  // receives the correct type — without this, JSON strings pass isInt/isFloat
  // validation but arrive at the service as strings, causing Prisma type errors.
  body('householdSize').isInt({ min: 1 }).toInt(),
  body('monthlyIncome').isFloat({ min: 0 }).toFloat(),
  body('employmentStatus').notEmpty().isLength({ max: 100 }),
  body('hardshipDescription').notEmpty().isLength({ max: 5000 }).withMessage('Hardship description must not exceed 5,000 characters'),
  body('assistanceType').notEmpty().isLength({ max: 100 }),
  body('requestedAmount').isFloat({ min: 1 }).toFloat(),
];

const router = Router();

router.post('/', validate(intakeValidation), ctrl.create);
router.get('/', authenticate, authorize(...INTERNAL), ctrl.list);
router.get('/:id', authenticate, authorize(...INTERNAL), ctrl.getById);
router.patch('/:id/status', authenticate, authorize('CASE_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'), validate([body('status').isIn(VALID_STATUSES).withMessage('Invalid status value')]), ctrl.updateStatus);
router.patch('/:id/assign', authenticate, authorize('CASE_MANAGER', 'ADMIN'), ctrl.assign);
router.patch('/:id/compliance', authenticate, authorize('COMPLIANCE_OFFICER', 'ADMIN'), ctrl.updateCompliance);
router.get('/:id/compliance/auto-check', authenticate, authorize('COMPLIANCE_OFFICER', 'ADMIN'), ctrl.autoCheckCompliance);

module.exports = router;
