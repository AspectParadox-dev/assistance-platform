const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.user.update({ where: { email: 'arshanwari03@gmail.com' }, data: { emailVerified: false } });
  console.log('[unverify-arsh] emailVerified set to false — resend will now send the email');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
