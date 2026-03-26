const prisma = require('../utils/prismaClient');

async function summary() {
  const [statusGroups, donationAgg, disbursementAgg, pendingDisbursements] = await Promise.all([
    prisma.application.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.donation.aggregate({ _sum: { amount: true }, _count: { id: true } }),
    prisma.disbursement.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.disbursement.aggregate({
      where: { status: 'SCHEDULED' },
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

async function reconciliation({ startDate, endDate, page = 1, limit = 50 } = {}) {
  const dateFilter = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) {
    // Include all records on the end date by advancing to end-of-day
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    dateFilter.lte = end;
  }

  const donationWhere = Object.keys(dateFilter).length ? { receivedDate: dateFilter } : {};
  const disbursementWhere = Object.keys(dateFilter).length ? { paidDate: dateFilter, status: 'PAID' } : { status: 'PAID' };

  // Fetch both the paginated rows (for display) and the full aggregates (for
  // accurate totals). Computing totals from only the current page's rows would
  // return a wrong balance whenever there is more than one page of data.
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

async function applicationStats({ startDate, endDate } = {}) {
  const where = {};
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
