const service = require('../services/users.service');

async function list(req, res, next) {
  try {
    const users = await service.list(req.user.organizationId);
    res.json(users);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const user = await service.create({ ...req.body, organizationId: req.user.organizationId });
    res.status(201).json(user);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const user = await service.update(req.params.id, req.body, req.user.organizationId);
    res.json(user);
  } catch (err) { next(err); }
}

async function deactivate(req, res, next) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot deactivate your own account.' });
    }
    const user = await service.deactivate(req.params.id, req.user.organizationId);
    res.json(user);
  } catch (err) { next(err); }
}

module.exports = { list, create, update, deactivate };
