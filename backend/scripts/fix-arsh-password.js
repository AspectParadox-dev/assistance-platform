const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Lump$01!', 10);
  await prisma.user.update({
    where: { email: 'arshanwari03@gmail.com' },
    data: { passwordHash: hash, emailVerified: true },
  });
  console.log('[fix-arsh] Password restored to Lump$01! and account verified.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
