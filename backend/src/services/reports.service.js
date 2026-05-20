const prisma = require('../utils/prismaClient');

async function summary(organizationId) {
  const orgFilter = organizationId ? { organizationId } : {};
  const disbursementOrgFilter = organizationId
    ? { application: { organizationId } }
    : {};

  const [statusGroups, donationAgg, disbursementAgg, pendingDisbursements] = await Promise.all([
    prisma.application.groupBy({ by: ['status'], where: orgFilter, _count: { id: true } }),
    prisma.donation.aggregate({ where: orgFilter, _sum: { amount: true }, _count: { id: true } }),
    prisma.disbursement.aggregate({
      where: { status: 'PAID', ...disbursementOrgFilter },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.disbursement.aggregate({
      where: { status: 'SCHEDULED', ...disbursementOrgFilter },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  const byStatus = {};
  for (const g of statusGroups) {
    byStatus[g.status] = g._count.id;
  }

  const totalDonated = donationAgg._sum.amount || 0;
  const totalDisbursed = disbursementAgg._sum.amount || 0;
  const balance = totalDonated - totalDisbursed;

  return {
    applicationsByStatus: byStatus,
    totalApplications: Object.values(byStatus).reduce((a, b) => a + b, 0),
    totalDonations: donationAgg._count.id,
    totalDonated,
    totalDisbursed,
    balance,
    pendingDisbursementsCount: pendingDisbursements._count.id,
    pendingDisbursementsAmount: pendingDisbursements._sum.amount || 0,
  };
}

async function reconciliation({ startDate, endDate, page = 1, limit = 50, organizationId } = {}) {
  const dateFilter = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    dateFilter.lte = end;
  }

  const hasDates = Object.keys(dateFilter).length > 0;
  const donationWhere = {
    ...(organizationId ? { organizationId } : {}),
    ...(hasDates ? { receivedDate: dateFilter } : {}),
  };
  const disbursementWhere = {
    ...(organizationId ? { application: { organizationId } } : {}),
    ...(hasDates ? { paidDate: dateFilter, status: 'PAID' } : { status: 'PAID' }),
  };

  const [donations, disbursements, donationAgg, disbursementAgg] = await Promise.all([
    prisma.donation.findMany({ where: donationWhere, orderBy: { receivedDate: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.disbursement.findMany({
      where: disbursementWhere,
      include: { application: { select: { referenceNumber: true, firstName: true, lastName: true } } },
      orderBy: { paidDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.donation.aggregate({ where: donationWhere, _sum: { amount: true } }),
    prisma.disbursement.aggregate({ where: disbursementWhere, _sum: { amount: true } }),
  ]);

  const totalIn = donationAgg._sum.amount || 0;
  const totalOut = disbursementAgg._sum.amount || 0;

  return { donations, disbursements, totalIn, totalOut, balance: totalIn - totalOut };
}

async function applicationStats({ startDate, endDate, organizationId } = {}) {
  const where = {};
  if (organizationId) where.organizationId = organizationId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const groups = await prisma.application.groupBy({ by: ['status'], where, _count: { id: true } });
  return groups.map((g) => ({ status: g.status, count: g._count.id }));
}

module.exports = { summary, reconciliation, applicationStats };
