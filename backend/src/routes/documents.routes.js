const { Router } = require('express');
const ctrl = require('../controllers/documents.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { uploadMultiple } = require('../middleware/upload');

const INTERNAL = ['CASE_MANAGER', 'COMPLIANCE_OFFICER', 'PRESIDENT', 'TREASURER', 'ADMIN'];

const router = Router({ mergeParams: true });

router.get('/', authenticate, authorize(...INTERNAL), ctrl.list);
router.post('/', authenticate, authorize('CASE_MANAGER', 'ADMIN'), uploadMultiple, ctrl.upload);
router.get('/:docId', authenticate, authorize(...INTERNAL), ctrl.download);
router.delete('/:docId', authenticate, authorize('CASE_MANAGER', 'ADMIN'), ctrl.remove);

module.exports = router;
