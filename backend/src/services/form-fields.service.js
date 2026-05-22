const prisma = require('../utils/prismaClient');

async function list(organizationId) {
  return prisma.formField.findMany({
    where: { organizationId },
    orderBy: { order: 'asc' },
  });
}

async function create(data, organizationId) {
  const { label, fieldKey, fieldType, required, placeholder, options } = data;

  // Place new field at the end
  const last = await prisma.formField.findFirst({
    where: { organizationId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });
  const order = last ? last.order + 1 : 0;

  return prisma.formField.create({
    data: { label, fieldKey, fieldType, required: !!required, placeholder, options, order, organizationId },
  });
}

async function update(id, data, organizationId) {
  const field = await prisma.formField.findFirst({ where: { id, organizationId } });
  if (!field) throw Object.assign(new Error('Form field not found'), { status: 404 });

  const { label, fieldKey, fieldType, required, placeholder, options } = data;
  return prisma.formField.update({
    where: { id },
    data: { label, fieldKey, fieldType, required: required !== undefined ? !!required : field.required, placeholder, options },
  });
}

async function remove(id, organizationId) {
  const field = await prisma.formField.findFirst({ where: { id, organizationId } });
  if (!field) throw Object.assign(new Error('Form field not found'), { status: 404 });
  return prisma.formField.delete({ where: { id } });
}

// Accepts [{ id, order }] and updates order for each field in the org
async function reorder(items, organizationId) {
  const ids = items.map((i) => i.id);
  const fields = await prisma.formField.findMany({ where: { id: { in: ids }, organizationId } });
  if (fields.length !== ids.length) throw Object.assign(new Error('One or more fields not found'), { status: 404 });

  await prisma.$transaction(
    items.map(({ id, order }) => prisma.formField.update({ where: { id }, data: { order } }))
  );
}

module.exports = { list, create, update, remove, reorder };
