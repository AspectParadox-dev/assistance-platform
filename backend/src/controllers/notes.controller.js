const service = require('../services/notes.service');

async function list(req, res, next) {
  try {
    const notes = await service.list(req.params.applicationId);
    res.json(notes);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { content } = req.body;
    // Coerce isInternal to a strict boolean so a string "false" isn't stored as true.
    // express-validator's isBoolean() allows the string values "true"/"false" when
    // toBoolean() is not applied, so we handle coercion explicitly here.
    const rawInternal = req.body.isInternal;
    const isInternal = rawInternal === true || rawInternal === 'true';
    const note = await service.create(req.params.applicationId, req.user.id, content, isInternal);
    res.status(201).json(note);
  } catch (err) { next(err); }
}

module.exports = { list, create };
