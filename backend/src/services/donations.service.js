const prisma = require('../utils/prismaClient');
const { parseDonationCsv } = require('../utils/csvParser');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

async function list({ method, startDate, endDate, page = 1, limit = 20, organizationId } = {}) {
  const where = {};
  if (organizationId) where.organizationId = organizationId;
  if (method) where.method = method;
  if (startDate || endDate) {
    where.receivedDate = {};
    if (startDate) where.receivedDate.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      where.receivedDate.lte = end;
    }
  }

  const [data, total] = await Promise.all([
    prisma.donation.findMany({ where, orderBy: { receivedDate: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.donation.count({ where }),
  ]);

  return { data, total, page: Number(page), limit: Number(limit) };
}

async function create(data, organizationId) {
  return prisma.donation.create({ data: { ...data, organizationId } });
}

async function importCsv(source, organizationId) {
  const isPath = !Buffer.isBuffer(source);
  const buffer = isPath ? fs.readFileSync(source) : source;

  let rows;
  try {
    rows = parseDonationCsv(buffer);
  } finally {
    if (isPath) {
      try { fs.unlinkSync(source); } catch { /* ignore cleanup errors */ }
    }
  }

  const importBatchId = uuidv4();

  const donations = await prisma.donation.createMany({
    data: rows.map((r) => ({ ...r, importBatchId, organizationId })),
  });

  return { count: donations.count, importBatchId };
}

async function update(id, data, organizationId) {
  const where = { id };
  if (organizationId) where.organizationId = organizationId;
  const existing = await prisma.donation.findFirst({ where });
  if (!existing) throw Object.assign(new Error('Donation not found'), { status: 404 });
  return prisma.donation.update({ where: { id }, data });
}

async function remove(id, organizationId) {
  const where = { id };
  if (organizationId) where.organizationId = organizationId;
  const existing = await prisma.donation.findFirst({ where });
  if (!existing) throw Object.assign(new Error('Donation not found'), { status: 404 });
  return prisma.donation.delete({ where: { id } });
}

module.exports = { list, create, importCsv, update, remove };
