require('dotenv').config();
const app = require('./app');
const prisma = require('./utils/prismaClient');

const PORT = process.env.PORT || 3000;

async function ensureDefaultOrg() {
  try {
    const org = await prisma.organization.upsert({
      where: { slug: 'default' },
      update: {},
      create: { name: 'Default Organization', slug: 'default', isActive: true },
    });
    const users = await prisma.user.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } });
    const apps = await prisma.application.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } });
    const donations = await prisma.donation.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } });
    if (users.count || apps.count || donations.count) {
      console.log(`[startup] Backfilled ${users.count} users, ${apps.count} applications, ${donations.count} donations to default org`);
    }
  } catch (err) {
    console.error('[startup] ensureDefaultOrg failed:', err.message);
  }
}

const server = app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await ensureDefaultOrg();
});

// Graceful shutdown: close DB connections on process exit signals
async function shutdown(signal) {
  console.log(`[server] ${signal} received — shutting down gracefully`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('[server] Prisma disconnected');
    } catch (err) {
      console.error('[server] Error disconnecting Prisma:', err.message);
    }
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Surface unhandled promise rejections so they are visible in logs
// instead of being silently swallowed
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled promise rejection:', reason);
});
