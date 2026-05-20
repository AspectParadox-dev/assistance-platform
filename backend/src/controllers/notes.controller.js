const service = require('../services/notes.service');

async function list(req, res, next) {
  try {
    const notes = await service.list(req.params.applicationId, req.user.organizationId);
    res.json(notes);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { content } = req.body;
    const rawInternal = req.body.isInternal;
    const isInternal = rawInternal === true || rawInternal === 'true';
    const note = await service.create(req.params.applicationId, req.user.id, content, isInternal, req.user.organizationId);
    res.status(201).json(note);
  } catch (err) { next(err); }
}

module.exports = { list, create };
