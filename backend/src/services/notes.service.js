const prisma = require('../utils/prismaClient');

async function list(applicationId, organizationId) {
  const where = { applicationId };
  if (organizationId) where.application = { organizationId };
  return prisma.note.findMany({
    where,
    include: { author: { select: { id: true, firstName: true, lastName: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

async function create(applicationId, authorId, content, isInternal = false, organizationId) {
  if (!content || content.length > 10000) {
    throw Object.assign(new Error('Note content must not exceed 10,000 characters'), { status: 400 });
  }
  const appWhere = { id: applicationId };
  if (organizationId) appWhere.organizationId = organizationId;
  const app = await prisma.application.findFirst({ where: appWhere, select: { id: true } });
  if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
  return prisma.note.create({
    data: { applicationId, authorId, content, isInternal },
    include: { author: { select: { id: true, firstName: true, lastName: true, role: true } } },
  });
}

module.exports = { list, create };
