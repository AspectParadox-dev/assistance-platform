const service = require('../services/disbursements.service');

async function list(req, res, next) {
  try {
    const { status, page, limit } = req.query;
    // applicationId can come from the nested route params (/applications/:applicationId/disbursements)
    // or as a query param on the top-level /disbursements route.
    const applicationId = req.params.applicationId || req.query.applicationId;
    const result = await service.list({ status, applicationId, page: Math.max(1, Number(page) || 1), limit: Math.min(100, Math.max(1, Number(limit) || 20)) });
    res.json(result);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const d = await service.getById(req.params.id);
    res.json(d);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const d = await service.create(req.params.applicationId, req.user.id, req.body);
    res.status(201).json(d);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const d = await service.update(req.params.id, req.body);
    res.json(d);
  } catch (err) { next(err); }
}

module.exports = { list, getById, create, update };
