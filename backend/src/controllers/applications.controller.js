const service = require('../services/applications.service');
const prisma = require('../utils/prismaClient');

async function create(req, res, next) {
  try {
    const { orgSlug, ...body } = req.body;
    if (!orgSlug) return res.status(400).json({ error: 'Bad Request', message: 'orgSlug is required' });
    const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
    if (!org || !org.isActive) return res.status(404).json({ error: 'Organization not found' });
    const app = await service.create(body, org.id);
    res.status(201).json(app);
  } catch (err) { next(err); }
}

async function list(req, res, next) {
  try {
    const { status, assignedCaseManagerId, search, page, limit } = req.query;
    const result = await service.list({
      status,
      assignedCaseManagerId,
      search,
      page: Math.max(1, Number(page) || 1),
      limit: Math.min(100, Math.max(1, Number(limit) || 20)),
      organizationId: req.user.organizationId,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const app = await service.getById(req.params.id, req.user.organizationId);
    res.json(app);
  } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
  try {
    if (req.user.role === 'CASE_MANAGER') {
      const app = await service.getById(req.params.id, req.user.organizationId);
      if (app.assignedCaseManagerId !== req.user.id) {
        return res.status(403).json({ error: 'You are not assigned to this application' });
      }
    }
    if (req.user.role === 'COMPLIANCE_OFFICER') {
      const app = await service.getById(req.params.id, req.user.organizationId);
      if (app.status !== 'COMPLIANCE_REVIEW') {
        return res.status(403).json({ error: 'Compliance officers can only advance applications in Compliance Review' });
      }
    }
    const app = await service.updateStatus(req.params.id, req.body.status, req.user.organizationId);
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
    const app = await service.assign(req.params.id, caseManagerId, req.user.organizationId);
    res.json(app);
  } catch (err) { next(err); }
}

async function updateCompliance(req, res, next) {
  try {
    const { checklistData } = req.body;
    if (checklistData === undefined) {
      return res.status(400).json({ error: 'Bad Request', message: 'checklistData is required' });
    }
    const app = await service.updateCompliance(req.params.id, checklistData, req.user.organizationId);
    res.json(app);
  } catch (err) { next(err); }
}

async function autoCheckCompliance(req, res, next) {
  try {
    const result = await service.autoCheckCompliance(req.params.id, req.user.organizationId);
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { create, list, getById, updateStatus, assign, updateCompliance, autoCheckCompliance };
