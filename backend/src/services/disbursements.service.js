const prisma = require('../utils/prismaClient');
const applicationsService = require('./applications.service');
const email = require('../utils/emailService');

async function list({ status, applicationId, page = 1, limit = 20 } = {}) {
  const where = {};
  if (status) where.status = status;
  if (applicationId) where.applicationId = applicationId;

  const [data, total] = await Promise.all([
    prisma.disbursement.findMany({
      where,
      include: {
        application: { select: { id: true, referenceNumber: true, firstName: true, lastName: true } },
        processedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.disbursement.count({ where }),
  ]);

  return { data, total, page: Number(page), limit: Number(limit) };
}

async function getById(id) {
  const d = await prisma.disbursement.findUnique({
    where: { id },
    include: {
      application: true,
      processedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!d) throw Object.assign(new Error('Disbursement not found'), { status: 404 });
  return d;
}

async function create(applicationId, processedById, data) {
  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
  if (app.status !== 'APPROVED') {
    throw Object.assign(new Error('Application must be in APPROVED status to schedule disbursement'), { status: 400 });
  }

  // Atomically create the disbursement and advance the application status together
  const [disbursement] = await prisma.$transaction([
    prisma.disbursement.create({
      data: { ...data, applicationId, processedById, status: 'SCHEDULED' },
      include: { processedBy: { select: { id: true, firstName: true, lastName: true } } },
    }),
    prisma.application.update({ where: { id: applicationId }, data: { status: 'DISBURSEMENT' } }),
  ]);

  const updatedApp = await prisma.application.findUnique({ where: { id: applicationId } });
  if (updatedApp) email.sendDisbursementScheduled(updatedApp, disbursement); // fire-and-forget
  return disbursement;
}

async function update(id, data) {
  const existing = await getById(id);
  // Guard: only allow the PAID transition from SCHEDULED; reject any other source state.
  if (data.status === 'PAID' && existing.status !== 'SCHEDULED') {
    if (existing.status === 'PAID') {
      throw Object.assign(new Error('Disbursement is already marked as PAID'), { status: 400 });
    }
    if (existing.status === 'CANCELLED') {
      throw Object.assign(new Error('Cannot mark a CANCELLED disbursement as PAID'), { status: 400 });
    }
    throw Object.assign(
      new Error(`Cannot mark disbursement as PAID from status ${existing.status}. Must be SCHEDULED.`),
      { status: 400 }
    );
  }
  const updateData = { ...data };
  const markingPaid = data.status === 'PAID' && existing.status === 'SCHEDULED';

  let updated;
  if (markingPaid) {
    updateData.paidDate = new Date();
    // Atomically mark the disbursement PAID and advance the application to COMPLETED
    const [disbursement] = await prisma.$transaction([
      prisma.disbursement.update({ where: { id }, data: updateData }),
      prisma.application.update({ where: { id: existing.applicationId }, data: { status: 'COMPLETED' } }),
    ]);
    updated = disbursement;
  } else {
    updated = await prisma.disbursement.update({ where: { id }, data: updateData });
  }

  if (markingPaid) {
    const app = await prisma.application.findUnique({ where: { id: existing.applicationId } });
    if (app) email.sendDisbursementPaid(app, updated); // fire-and-forget
  }

  return updated;
}

module.exports = { list, getById, create, update };
