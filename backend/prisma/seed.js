const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  // Create one user per role
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: hash('Admin123!'),
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
    },
  });

  const caseManager = await prisma.user.upsert({
    where: { email: 'cm@example.com' },
    update: {},
    create: {
      email: 'cm@example.com',
      passwordHash: hash('CaseManager123!'),
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'CASE_MANAGER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'compliance@example.com' },
    update: {},
    create: {
      email: 'compliance@example.com',
      passwordHash: hash('Compliance123!'),
      firstName: 'Bob',
      lastName: 'Jones',
      role: 'COMPLIANCE_OFFICER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'president@example.com' },
    update: {},
    create: {
      email: 'president@example.com',
      passwordHash: hash('President123!'),
      firstName: 'Mary',
      lastName: 'Williams',
      role: 'PRESIDENT',
    },
  });

  await prisma.user.upsert({
    where: { email: 'treasurer@example.com' },
    update: {},
    create: {
      email: 'treasurer@example.com',
      passwordHash: hash('Treasurer123!'),
      firstName: 'Tom',
      lastName: 'Brown',
      role: 'TREASURER',
    },
  });

  // Sample applications
  const apps = [
    {
      referenceNumber: 'APP-2026-00001',
      status: 'SUBMITTED',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@example.com',
      phone: '555-0101',
      address: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
      householdSize: 3,
      monthlyIncome: 2200,
      employmentStatus: 'Part-time',
      hardshipDescription: 'Lost primary income due to medical emergency.',
      assistanceType: 'Rent',
      requestedAmount: 800,
    },
    {
      referenceNumber: 'APP-2026-00002',
      status: 'UNDER_REVIEW',
      firstName: 'Carlos',
      lastName: 'Rivera',
      email: 'carlos@example.com',
      phone: '555-0102',
      address: '456 Oak Ave',
      city: 'Springfield',
      state: 'IL',
      zip: '62702',
      householdSize: 2,
      monthlyIncome: 1800,
      employmentStatus: 'Unemployed',
      hardshipDescription: 'Recently laid off, struggling with utilities.',
      assistanceType: 'Utilities',
      requestedAmount: 350,
      assignedCaseManagerId: caseManager.id,
    },
    {
      referenceNumber: 'APP-2026-00003',
      status: 'PENDING_DECISION',
      firstName: 'Diana',
      lastName: 'Lee',
      email: 'diana@example.com',
      phone: '555-0103',
      address: '789 Pine Rd',
      city: 'Springfield',
      state: 'IL',
      zip: '62703',
      householdSize: 4,
      monthlyIncome: 3100,
      employmentStatus: 'Full-time',
      hardshipDescription: 'Unexpected medical bills depleted savings.',
      assistanceType: 'Medical',
      requestedAmount: 1200,
      assignedCaseManagerId: caseManager.id,
    },
    {
      referenceNumber: 'APP-2026-00004',
      status: 'APPROVED',
      firstName: 'Edward',
      lastName: 'Kim',
      email: 'edward@example.com',
      phone: '555-0104',
      address: '321 Elm St',
      city: 'Springfield',
      state: 'IL',
      zip: '62704',
      householdSize: 1,
      monthlyIncome: 1500,
      employmentStatus: 'Part-time',
      hardshipDescription: 'Vehicle breakdown affecting ability to get to work.',
      assistanceType: 'Transportation',
      requestedAmount: 500,
      assignedCaseManagerId: caseManager.id,
    },
    {
      referenceNumber: 'APP-2026-00005',
      status: 'COMPLETED',
      firstName: 'Fatima',
      lastName: 'Hassan',
      email: 'fatima@example.com',
      phone: '555-0105',
      address: '654 Maple Dr',
      city: 'Springfield',
      state: 'IL',
      zip: '62705',
      householdSize: 5,
      monthlyIncome: 2800,
      employmentStatus: 'Full-time',
      hardshipDescription: 'Housing instability after fire damage.',
      assistanceType: 'Housing',
      requestedAmount: 1500,
      assignedCaseManagerId: caseManager.id,
    },
  ];

  for (const app of apps) {
    await prisma.application.upsert({
      where: { referenceNumber: app.referenceNumber },
      update: {},
      create: app,
    });
  }

  // Sample donations — use upsert on referenceNumber to avoid duplicates when seed is run more than once.
  // Donations without a referenceNumber are skipped if one already exists (checked by donor+amount+date).
  const donations = [
    { donorName: 'Community Fund', amount: 5000, method: 'CHECK', referenceNumber: 'SEED-CHK-001', receivedDate: new Date('2026-01-15') },
    { donorName: 'Anonymous', amount: 250, method: 'ZELLE', referenceNumber: 'SEED-ANON-001', receivedDate: new Date('2026-02-01') },
    { donorName: 'Local Business Inc', amount: 1000, method: 'ACH', referenceNumber: 'SEED-ACH-001', receivedDate: new Date('2026-02-15') },
    { donorName: 'City Foundation', amount: 3000, method: 'CHECK', referenceNumber: 'SEED-CHK-002', receivedDate: new Date('2026-03-01') },
  ];

  // Donation.referenceNumber is not @unique in the schema, so upsert cannot be
  // used on that field. Use a findFirst check to make the seed idempotent.
  for (const donation of donations) {
    const exists = await prisma.donation.findFirst({
      where: {
        donorName: donation.donorName,
        amount: donation.amount,
        receivedDate: donation.receivedDate,
      },
    });
    if (!exists) {
      await prisma.donation.create({ data: donation });
    }
  }

  console.log('Seed complete.');
  console.log('\nDefault credentials:');
  console.log('  admin@example.com          / Admin123!');
  console.log('  cm@example.com             / CaseManager123!');
  console.log('  compliance@example.com     / Compliance123!');
  console.log('  president@example.com      / President123!');
  console.log('  treasurer@example.com      / Treasurer123!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
