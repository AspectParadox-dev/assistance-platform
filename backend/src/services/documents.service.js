const prisma = require('../utils/prismaClient');
const storageService = require('../utils/storageService');

async function list(applicationId, organizationId) {
  const where = { applicationId };
  if (organizationId) where.application = { organizationId };
  return prisma.document.findMany({
    where,
    include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

async function create(applicationId, uploadedById, fileInfo, organizationId) {
  // Verify application belongs to org before accepting the upload
  const appWhere = { id: applicationId };
  if (organizationId) appWhere.organizationId = organizationId;
  const app = await prisma.application.findFirst({ where: appWhere, select: { id: true } });
  if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });

  let storagePath, filename;

  if (storageService.isS3()) {
    const result = await storageService.upload(fileInfo.buffer, fileInfo.originalname, fileInfo.mimetype);
    storagePath = result.storagePath;
    filename = result.filename;
  } else {
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

async function getById(docId, applicationId, organizationId) {
  const where = { id: docId };
  if (applicationId) where.applicationId = applicationId;
  if (organizationId) where.application = { organizationId };
  const doc = await prisma.document.findFirst({ where });
  if (!doc) throw Object.assign(new Error('Document not found'), { status: 404 });
  return doc;
}

async function remove(docId, applicationId, organizationId) {
  const doc = await getById(docId, applicationId, organizationId);
  await prisma.document.delete({ where: { id: docId } });
  try {
    await storageService.remove(doc.storagePath);
  } catch (err) {
    console.error('[documents] Storage removal failed for', doc.storagePath, err.message);
  }
}

module.exports = { list, create, getById, remove };
