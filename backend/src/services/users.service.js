const prisma = require('../utils/prismaClient');
const { hashPassword, sendVerificationEmail } = require('./auth.service');

async function list(organizationId) {
  const where = {};
  if (organizationId) where.organizationId = organizationId;
  return prisma.user.findMany({
    where,
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

async function create({ email, firstName, lastName, role, password, organizationId }) {
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, firstName, lastName, role, passwordHash, organizationId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
  });
  sendVerificationEmail(user.id).catch((err) => {
    console.error('[users] Failed to send verification email to', email, ':', err.message);
  });
  return user;
}

async function update(id, { firstName, lastName, role, email }, organizationId) {
  const where = { id };
  if (organizationId) where.organizationId = organizationId;
  const existing = await prisma.user.findFirst({ where });
  if (!existing) throw Object.assign(new Error('User not found'), { status: 404 });

  const data = {};
  if (firstName !== undefined) data.firstName = firstName;
  if (lastName !== undefined) data.lastName = lastName;
  if (role !== undefined) data.role = role;
  if (email !== undefined) data.email = email;

  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
  });
}

async function deactivate(id, organizationId) {
  const where = { id };
  if (organizationId) where.organizationId = organizationId;
  const existing = await prisma.user.findFirst({ where });
  if (!existing) throw Object.assign(new Error('User not found'), { status: 404 });
  return prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, email: true, isActive: true },
  });
}

module.exports = { list, create, update, deactivate };
