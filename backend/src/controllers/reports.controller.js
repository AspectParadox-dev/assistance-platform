const service = require('../services/reports.service');

async function summary(req, res, next) {
  try {
    const data = await service.summary(req.user.organizationId);
    res.json(data);
  } catch (err) { next(err); }
}

async function reconciliation(req, res, next) {
  try {
    const { startDate, endDate, page, limit } = req.query;
    const data = await service.reconciliation({
      startDate,
      endDate,
      page: Math.max(1, Number(page) || 1),
      limit: Math.min(200, Math.max(1, Number(limit) || 50)),
      organizationId: req.user.organizationId,
    });
    res.json(data);
  } catch (err) { next(err); }
}

async function applicationStats(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const data = await service.applicationStats({ startDate, endDate, organizationId: req.user.organizationId });
    res.json(data);
  } catch (err) { next(err); }
}

module.exports = { summary, reconciliation, applicationStats };
