const prisma = require('../utils/prismaClient');
const storageService = require('../utils/storageService');

async function list(applicationId) {
  return prisma.document.findMany({
    where: { applicationId },
    include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

async function create(applicationId, uploadedById, fileInfo) {
  let storagePath, filename;

  if (storageService.isS3()) {
    // fileInfo.buffer is set by multer memoryStorage
    const result = await storageService.upload(fileInfo.buffer, fileInfo.originalname, fileInfo.mimetype);
    storagePath = result.storagePath;
    filename = result.filename;
  } else {
    // fileInfo.path and fileInfo.filename are set by multer diskStorage
    storagePath = fileInfo.path;
    filename = fileInfo.filename;
  }

  return prisma.document.create({
    data: {
      applicationId,
      uploadedById,
      filename,
      originalName: fileInfo.originalname,
      mimeType: fileInfo.mimetype,
      size: fileInfo.size,
      storagePath,
    },
    include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
  });
}

async function getById(docId, applicationId) {
  const where = { id: docId };
  if (applicationId) where.applicationId = applicationId;
  const doc = await prisma.document.findFirst({ where });
  if (!doc) throw Object.assign(new Error('Document not found'), { status: 404 });
  return doc;
}

async function remove(docId, applicationId) {
  const doc = await getById(docId, applicationId);
  // Delete the DB record first. If the DB delete succeeds but storage removal
  // fails we still avoid leaving a stale record pointing to a missing file.
  // The reverse order (storage-first) would leave an orphaned DB record if
  // prisma.delete subsequently threw.
  await prisma.document.delete({ where: { id: docId } });
  // Best-effort: remove the file; don't throw if storage cleanup fails.
  try {
    await storageService.remove(doc.storagePath);
  } catch (err) {
    console.error('[documents] Storage removal failed for', doc.storagePath, err.message);
  }
}

module.exports = { list, create, getById, remove };
