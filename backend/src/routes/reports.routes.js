const { Router } = require('express');
const ctrl = require('../controllers/reports.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const INTERNAL = ['CASE_MANAGER', 'COMPLIANCE_OFFICER', 'PRESIDENT', 'TREASURER', 'ADMIN'];

const router = Router();

router.get('/summary', authenticate, authorize('PRESIDENT', 'TREASURER', 'ADMIN'), ctrl.summary);
router.get('/reconciliation', authenticate, authorize('PRESIDENT', 'TREASURER', 'ADMIN'), ctrl.reconciliation);
router.get('/applications', authenticate, authorize(...INTERNAL), ctrl.applicationStats);

module.exports = router;
