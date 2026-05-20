const prisma = require('../utils/prismaClient');
const { isValidTransition } = require('../utils/statusMachine');
const email = require('../utils/emailService');

const APPLICATION_INCLUDE = {
  assignedCaseManager: { select: { id: true, firstName: true, lastName: true, email: true } },
  notes: { include: { author: { select: { id: true, firstName: true, lastName: true, role: true } } }, orderBy: { createdAt: 'asc' } },
  documents: { include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } },
  decisions: { include: { madeBy: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } },
  disbursements: { include: { processedBy: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } },
};

async function generateReferenceNumber(organizationId) {
  const year = new Date().getFullYear();
  const latest = await prisma.application.findFirst({
    where: { referenceNumber: { startsWith: `APP-${year}-` }, organizationId },
    orderBy: { referenceNumber: 'desc' },
    select: { referenceNumber: true },
  });
  const next = latest ? parseInt(latest.referenceNumber.split('-')[2], 10) + 1 : 1;
  return `APP-${year}-${String(next).padStart(5, '0')}`;
}

async function create(data, organizationId) {
  // Whitelist only the fields that the public intake form is allowed to set.
  const safeData = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    address: data.address,
    city: data.city,
    state: data.state,
    zip: data.zip,
    householdSize: data.householdSize,
    monthlyIncome: data.monthlyIncome,
    employmentStatus: data.employmentStatus,
    hardshipDescription: data.hardshipDescription,
    assistanceType: data.assistanceType,
    requestedAmount: data.requestedAmount,
  };

  // Retry up to 5 times to handle concurrent submissions hitting the same sequence number
  let lastError;
  for (let attempt = 0; attempt < 5; attempt++) {
    const referenceNumber = await generateReferenceNumber(organizationId);
    try {
      const app = await prisma.application.create({
        data: { ...safeData, referenceNumber, status: 'SUBMITTED', organizationId },
      });
      email.sendApplicationReceived(app); // fire-and-forget
      return app;
    } catch (err) {
      if (err.code === 'P2002') { lastError = err; continue; } // unique constraint — retry
      throw err;
    }
  }
  throw Object.assign(new Error('Could not generate a unique reference number. Please try again.'), { status: 409, cause: lastError });
}

async function list({ status, assignedCaseManagerId, search, page = 1, limit = 20, organizationId } = {}) {
  const where = {};
  if (organizationId) where.organizationId = organizationId;
  if (status) where.status = status;
  if (assignedCaseManagerId) where.assignedCaseManagerId = assignedCaseManagerId;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { referenceNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.application.findMany({
      where,
      include: { assignedCaseManager: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.application.count({ where }),
  ]);

  return { data, total, page: Number(page), limit: Number(limit) };
}

async function getById(id, organizationId) {
  const where = { id };
  if (organizationId) where.organizationId = organizationId;
  const app = await prisma.application.findFirst({ where, include: APPLICATION_INCLUDE });
  if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
  return app;
}

async function updateStatus(id, newStatus, organizationId) {
  const updated = await prisma.$transaction(async (tx) => {
    const where = { id };
    if (organizationId) where.organizationId = organizationId;
    const app = await tx.application.findFirst({ where });
    if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
    if (!isValidTransition(app.status, newStatus)) {
      throw Object.assign(
        new Error(`Cannot transition from ${app.status} to ${newStatus}`),
        { status: 400 }
      );
    }
    return tx.application.update({ where: { id }, data: { status: newStatus } });
  });

  const NOTIFY_STATUSES = ['UNDER_REVIEW', 'PENDING_INFO', 'DISBURSEMENT', 'COMPLETED'];
  if (NOTIFY_STATUSES.includes(newStatus)) {
    email.sendStatusUpdated(updated, newStatus); // fire-and-forget
  }
  return updated;
}

async function assign(id, caseManagerId, organizationId) {
  const where = { id };
  if (organizationId) where.organizationId = organizationId;
  const app = await prisma.application.findFirst({ where });
  if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });

  // Verify the case manager belongs to the same org
  const caseManagerWhere = { id: caseManagerId };
  if (organizationId) caseManagerWhere.organizationId = organizationId;
  const caseManager = await prisma.user.findFirst({ where: caseManagerWhere });
  if (!caseManager) throw Object.assign(new Error('User not found'), { status: 404 });
  if (!['CASE_MANAGER', 'ADMIN'].includes(caseManager.role)) {
    throw Object.assign(new Error('Only users with the Case Manager or Admin role can be assigned to applications'), { status: 400 });
  }

  const data = { assignedCaseManagerId: caseManagerId };
  if (app.status === 'SUBMITTED') data.status = 'UNDER_REVIEW';

  const updated = await prisma.application.update({ where: { id }, data });
  email.sendCaseAssigned(caseManager, updated); // fire-and-forget

  return updated;
}

async function updateCompliance(id, checklistData, organizationId) {
  const where = { id };
  if (organizationId) where.organizationId = organizationId;
  const app = await prisma.application.findFirst({ where });
  if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
  return prisma.application.update({ where: { id }, data: { complianceChecklistData: checklistData } });
}

async function autoCheckCompliance(id, organizationId) {
  // Verify app belongs to org before running compliance check
  const where = { id };
  if (organizationId) where.organizationId = organizationId;
  const app = await prisma.application.findFirst({ where });
  if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
  const { evaluate } = require('../utils/complianceAutomation');
  return evaluate(id);
}

module.exports = { create, list, getById, updateStatus, assign, updateCompliance, autoCheckCompliance };
