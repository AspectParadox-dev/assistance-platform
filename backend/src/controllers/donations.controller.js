const service = require('../services/donations.service');

async function list(req, res, next) {
  try {
    const { method, startDate, endDate, page, limit } = req.query;
    const result = await service.list({
      method,
      startDate,
      endDate,
      page: Math.max(1, Number(page) || 1),
      limit: Math.min(100, Math.max(1, Number(limit) || 20)),
      organizationId: req.user.organizationId,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const donation = await service.create(req.body, req.user.organizationId);
    res.status(201).json(donation);
  } catch (err) { next(err); }
}

async function importCsv(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });
    const source = req.file.buffer || req.file.path;
    if (!source) return res.status(400).json({ error: 'Uploaded file has no readable content' });
    const result = await service.importCsv(source, req.user.organizationId);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const donation = await service.update(req.params.id, req.body, req.user.organizationId);
    res.json(donation);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await service.remove(req.params.id, req.user.organizationId);
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { list, create, importCsv, update, remove };
