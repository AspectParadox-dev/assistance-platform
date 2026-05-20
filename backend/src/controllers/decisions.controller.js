const service = require('../services/decisions.service');

async function list(req, res, next) {
  try {
    const decisions = await service.list(req.params.applicationId, req.user.organizationId);
    res.json(decisions);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const decision = await service.create(req.params.applicationId, req.user.id, req.body, req.user.organizationId);
    res.status(201).json(decision);
  } catch (err) { next(err); }
}

module.exports = { list, create };
