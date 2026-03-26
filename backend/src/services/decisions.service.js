const prisma = require('../utils/prismaClient');
const applicationsService = require('./applications.service');
const email = require('../utils/emailService');

const OUTCOME_TO_STATUS = {
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PENDING_INFO: 'PENDING_INFO',
};

async function list(applicationId) {
  return prisma.decision.findMany({
    where: { applicationId },
    include: { madeBy: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

async function create(applicationId, madeById, { outcome, rationale, approvedAmount }) {
  const newStatus = OUTCOME_TO_STATUS[outcome];

  // Wrap the status check, decision creation, and status update in a single
  // serializable transaction so that two concurrent requests cannot both read
  // PENDING_DECISION and both succeed — the second will see the already-changed
  // status and be rejected.
  const decision = await prisma.$transaction(async (tx) => {
    const existing = await tx.application.findUnique({ where: { id: applicationId } });
    if (!existing) throw Object.assign(new Error('Application not found'), { status: 404 });
    if (existing.status !== 'PENDING_DECISION') {
      throw Object.assign(
        new Error(`Cannot record a decision on an application with status ${existing.status}. Application must be in PENDING_DECISION.`),
        { status: 400 }
      );
    }

    const dec = await tx.decision.create({
      data: { applicationId, madeById, outcome, rationale, approvedAmount: approvedAmount || null },
      include: { madeBy: { select: { id: true, firstName: true, lastName: true } } },
    });

    if (newStatus) {
      await tx.application.update({ where: { id: applicationId }, data: { status: newStatus } });
    }

    return dec;
  });

  // Fetch the application to get the applicant's email + name for the notification
  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (app) email.sendDecision(app, decision); // fire-and-forget

  return decision;
}

module.exports = { list, create };
