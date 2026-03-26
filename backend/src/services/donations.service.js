const prisma = require('../utils/prismaClient');
const { parseDonationCsv } = require('../utils/csvParser');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

async function list({ method, startDate, endDate, page = 1, limit = 20 } = {}) {
  const where = {};
  if (method) where.method = method;
  if (startDate || endDate) {
    where.receivedDate = {};
    if (startDate) where.receivedDate.gte = new Date(startDate);
    if (endDate) {
      // Include all records on the end date by advancing to end-of-day
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

async function create(data) {
  return prisma.donation.create({ data });
}

async function importCsv(source) {
  // source is either a Buffer (memory storage) or a file path string (disk storage)
  const isPath = !Buffer.isBuffer(source);
  const buffer = isPath ? fs.readFileSync(source) : source;

  let rows;
  try {
    // Parse before writing to DB so validation errors are caught first
    rows = parseDonationCsv(buffer);
  } finally {
    // Always clean up the temp file — even if parsing throws, so we don't
    // leave orphaned files on disk when the CSV contains invalid data.
    if (isPath) {
      try { fs.unlinkSync(source); } catch { /* ignore cleanup errors */ }
    }
  }

  const importBatchId = uuidv4();

  const donations = await prisma.donation.createMany({
    data: rows.map((r) => ({ ...r, importBatchId })),
  });

  return { count: donations.count, importBatchId };
}

async function update(id, data) {
  const existing = await prisma.donation.findUnique({ where: { id } });
  if (!existing) throw Object.assign(new Error('Donation not found'), { status: 404 });
  return prisma.donation.update({ where: { id }, data });
}

async function remove(id) {
  const existing = await prisma.donation.findUnique({ where: { id } });
  if (!existing) throw Object.assign(new Error('Donation not found'), { status: 404 });
  return prisma.donation.delete({ where: { id } });
}

module.exports = { list, create, importCsv, update, remove };
