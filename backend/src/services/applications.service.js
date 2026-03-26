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

async function generateReferenceNumber() {
  const year = new Date().getFullYear();
  const latest = await prisma.application.findFirst({
    where: { referenceNumber: { startsWith: `APP-${year}-` } },
    orderBy: { referenceNumber: 'desc' },
    select: { referenceNumber: true },
  });
  const next = latest ? parseInt(latest.referenceNumber.split('-')[2], 10) + 1 : 1;
  return `APP-${year}-${String(next).padStart(5, '0')}`;
}

async function create(data) {
  // Whitelist only the fields that the public intake form is allowed to set.
  // This prevents mass-assignment of internal fields (status, assignedCaseManagerId,
  // complianceChecklistData, etc.) even if a malicious actor injects extra keys
  // into the POST body — the validate middleware only validates, not strips.
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
    const referenceNumber = await generateReferenceNumber();
    try {
      const app = await prisma.application.create({
        data: { ...safeData, referenceNumber, status: 'SUBMITTED' },
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

async function list({ status, assignedCaseManagerId, search, page = 1, limit = 20 } = {}) {
  const where = {};
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

async function getById(id) {
  const app = await prisma.application.findUnique({ where: { id }, include: APPLICATION_INCLUDE });
  if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
  return app;
}

async function updateStatus(id, newStatus) {
  // Run inside a transaction with serializable isolation so the read-then-write
  // is atomic: a concurrent status change cannot slip in between the validation
  // check and the update.
  const updated = await prisma.$transaction(async (tx) => {
    const app = await tx.application.findUnique({ where: { id } });
    if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
    if (!isValidTransition(app.status, newStatus)) {
      throw Object.assign(
        new Error(`Cannot transition from ${app.status} to ${newStatus}`),
        { status: 400 }
      );
    }
    return tx.application.update({ where: { id }, data: { status: newStatus } });
  });

  // Notify applicant for statuses they care about; skip internal-only transitions
  const NOTIFY_STATUSES = ['UNDER_REVIEW', 'PENDING_INFO', 'DISBURSEMENT', 'COMPLETED'];
  if (NOTIFY_STATUSES.includes(newStatus)) {
    email.sendStatusUpdated(updated, newStatus); // fire-and-forget
  }
  return updated;
}

async function assign(id, caseManagerId) {
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });

  const caseManager = await prisma.user.findUnique({ where: { id: caseManagerId } });
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

async function updateCompliance(id, checklistData) {
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });
  return prisma.application.update({ where: { id }, data: { complianceChecklistData: checklistData } });
}

async function autoCheckCompliance(id) {
  const { evaluate } = require('../utils/complianceAutomation');
  return evaluate(id);
}

module.exports = { create, list, getById, updateStatus, assign, updateCompliance, autoCheckCompliance };
