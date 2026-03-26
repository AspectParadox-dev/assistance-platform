const prisma = require('../utils/prismaClient');
const { hashPassword } = require('./auth.service');

async function list() {
  return prisma.user.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
}

async function create({ email, firstName, lastName, role, password }) {
  const passwordHash = await hashPassword(password);
  return prisma.user.create({
    data: { email, firstName, lastName, role, passwordHash },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
  });
}

async function update(id, { firstName, lastName, role, email }) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw Object.assign(new Error('User not found'), { status: 404 });

  // Only include fields that were explicitly provided — avoids inadvertently
  // clearing values when a partial update is performed (e.g. role-only edit).
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

async function deactivate(id) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw Object.assign(new Error('User not found'), { status: 404 });
  return prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, email: true, isActive: true },
  });
}

module.exports = { list, create, update, deactivate };
