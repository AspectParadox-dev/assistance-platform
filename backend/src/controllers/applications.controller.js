const service = require('../services/applications.service');

async function create(req, res, next) {
  try {
    const app = await service.create(req.body);
    res.status(201).json(app);
  } catch (err) { next(err); }
}

async function list(req, res, next) {
  try {
    const { status, assignedCaseManagerId, search, page, limit } = req.query;
    // Guard against page=0 and page=-N: Number('0')||1 = 1 (correct), but Number('-1')||-1 = -1 which
    // produces a negative skip value that Prisma rejects. Math.max(1, ...) prevents both.
    const result = await service.list({ status, assignedCaseManagerId, search, page: Math.max(1, Number(page) || 1), limit: Math.min(100, Math.max(1, Number(limit) || 20)) });
    res.json(result);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const app = await service.getById(req.params.id);
    res.json(app);
  } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
  try {
    if (req.user.role === 'CASE_MANAGER') {
      const app = await service.getById(req.params.id);
      if (app.assignedCaseManagerId !== req.user.id) {
        return res.status(403).json({ error: 'You are not assigned to this application' });
      }
    }
    if (req.user.role === 'COMPLIANCE_OFFICER') {
      const app = await service.getById(req.params.id);
      if (app.status !== 'COMPLIANCE_REVIEW') {
        return res.status(403).json({ error: 'Compliance officers can only advance applications in Compliance Review' });
      }
    }
    const app = await service.updateStatus(req.params.id, req.body.status);
    res.json(app);
  } catch (err) { next(err); }
}

async function assign(req, res, next) {
  try {
    const { caseManagerId } = req.body;
    if (!caseManagerId) {
      return res.status(400).json({ error: 'Bad Request', message: 'caseManagerId is required' });
    }
    if (req.user.role === 'CASE_MANAGER' && caseManagerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'Case managers can only assign applications to themselves' });
    }
    const app = await service.assign(req.params.id, caseManagerId);
    res.json(app);
  } catch (err) { next(err); }
}

async function updateCompliance(req, res, next) {
  try {
    const { checklistData } = req.body;
    if (checklistData === undefined) {
      return res.status(400).json({ error: 'Bad Request', message: 'checklistData is required' });
    }
    const app = await service.updateCompliance(req.params.id, checklistData);
    res.json(app);
  } catch (err) { next(err); }
}

async function autoCheckCompliance(req, res, next) {
  try {
    const result = await service.autoCheckCompliance(req.params.id);
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { create, list, getById, updateStatus, assign, updateCompliance, autoCheckCompliance };
