const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'arshanwari03@gmail.com' },
    update: {},
    create: {
      email: 'arshanwari03@gmail.com',
      passwordHash: bcrypt.hashSync('Arsh123!', 10),
      firstName: 'Arsh',
      lastName: 'Anwari',
      role: 'CASE_MANAGER',
    },
  });

  console.log('Done! Arsh Anwari added as Case Manager.');
  console.log('  Email:    arshanwari03@gmail.com');
  console.log('  Password: Arsh123!');
}

main()
  .catch((e) => { console.error('Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
