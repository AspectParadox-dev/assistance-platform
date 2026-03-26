const { Router } = require('express');
const ctrl = require('../controllers/donations.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { uploadCsv } = require('../middleware/upload');
const { body } = require('express-validator');

const router = Router();

const donationValidation = [
  body('donorName').notEmpty(),
  body('amount').isFloat({ min: 0.01 }),
  body('method').isIn(['CHECK', 'ZELLE', 'ACH', 'CASH', 'ONLINE', 'OTHER']),
  body('receivedDate').isISO8601(),
];

router.get('/', authenticate, authorize('TREASURER', 'ADMIN', 'PRESIDENT'), ctrl.list);
router.post('/', authenticate, authorize('TREASURER', 'ADMIN'), validate(donationValidation), ctrl.create);
router.post('/import', authenticate, authorize('TREASURER', 'ADMIN'), uploadCsv, ctrl.importCsv);
router.patch('/:id', authenticate, authorize('TREASURER', 'ADMIN'), validate([
  body('donorName').optional().notEmpty().withMessage('Donor name cannot be empty'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('method').optional().isIn(['CHECK', 'ZELLE', 'ACH', 'CASH', 'ONLINE', 'OTHER']).withMessage('Invalid payment method'),
  body('receivedDate').optional().isISO8601().withMessage('receivedDate must be a valid date'),
]), ctrl.update);
router.delete('/:id', authenticate, authorize('TREASURER', 'ADMIN'), ctrl.remove);

module.exports = router;
