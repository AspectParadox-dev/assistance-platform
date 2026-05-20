const prisma = require('../utils/prismaClient');
const email = require('../utils/emailService');

const OUTCOME_TO_STATUS = {
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PENDING_INFO: 'PENDING_INFO',
};

async function list(applicationId, organizationId) {
  const where = { applicationId };
  if (organizationId) where.application = { organizationId };
  return prisma.decision.findMany({
    where,
    include: { madeBy: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

async function create(applicationId, madeById, { outcome, rationale, approvedAmount }, organizationId) {
  const newStatus = OUTCOME_TO_STATUS[outcome];

  const decision = await prisma.$transaction(async (tx) => {
    const appWhere = { id: applicationId };
    if (organizationId) appWhere.organizationId = organizationId;
    const existing = await tx.application.findFirst({ where: appWhere });
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

  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (app) email.sendDecision(app, decision); // fire-and-forget

  return decision;
}

module.exports = { list, create };
