const service = require('../services/documents.service');
const storageService = require('../utils/storageService');
const path = require('path');

async function list(req, res, next) {
  try {
    const docs = await service.list(req.params.applicationId);
    res.json(docs);
  } catch (err) { next(err); }
}

async function upload(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const emptyFile = req.files.find((f) => f.size === 0);
    if (emptyFile) {
      return res.status(400).json({ error: 'Empty file uploads are not allowed', file: emptyFile.originalname });
    }
    const docs = await Promise.all(
      req.files.map((f) => service.create(req.params.applicationId, req.user.id, f))
    );
    res.status(201).json(docs);
  } catch (err) { next(err); }
}

async function download(req, res, next) {
  try {
    const doc = await service.getById(req.params.docId, req.params.applicationId);

    if (storageService.isS3()) {
      // Generate a pre-signed URL valid for 1 hour and redirect the client to it
      const url = await storageService.getDownloadUrl(doc.storagePath);
      return res.redirect(url);
    }

    // Local disk — serve the file directly
    res.download(path.resolve(doc.storagePath), doc.originalName);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await service.remove(req.params.docId, req.params.applicationId);
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { list, upload, download, remove };
