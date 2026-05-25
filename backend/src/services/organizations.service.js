const prisma = require('../utils/prismaClient');

async function getById(organizationId) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw Object.assign(new Error('Organization not found'), { status: 404 });
  return org;
}

async function update(organizationId, data) {
  const { name } = data;
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw Object.assign(new Error('Organization not found'), { status: 404 });
  return prisma.organization.update({
    where: { id: organizationId },
    data: { name },
  });
}

module.exports = { getById, update };
