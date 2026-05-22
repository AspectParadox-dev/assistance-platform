const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const controller = require('../controllers/form-fields.controller');

const router = Router();

const adminOnly = [authenticate, authorize('ADMIN')];

router.get('/', ...adminOnly, controller.list);
router.post('/', ...adminOnly, controller.create);
router.patch('/reorder', ...adminOnly, controller.reorder);
router.put('/:id', ...adminOnly, controller.update);
router.delete('/:id', ...adminOnly, controller.remove);

module.exports = router;
