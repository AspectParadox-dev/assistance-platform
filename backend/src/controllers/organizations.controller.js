const service = require('../services/organizations.service');

async function get(req, res, next) {
  try {
    const org = await service.getById(req.user.organizationId);
    res.json(org);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const org = await service.update(req.user.organizationId, req.body);
    res.json(org);
  } catch (err) { next(err); }
}

module.exports = { get, update };
