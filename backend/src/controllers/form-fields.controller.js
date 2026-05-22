const service = require('../services/form-fields.service');

async function list(req, res, next) {
  try {
    const fields = await service.list(req.user.organizationId);
    res.json(fields);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const field = await service.create(req.body, req.user.organizationId);
    res.status(201).json(field);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const field = await service.update(req.params.id, req.body, req.user.organizationId);
    res.json(field);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await service.remove(req.params.id, req.user.organizationId);
    res.status(204).end();
  } catch (err) { next(err); }
}

async function reorder(req, res, next) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array' });
    await service.reorder(items, req.user.organizationId);
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove, reorder };
