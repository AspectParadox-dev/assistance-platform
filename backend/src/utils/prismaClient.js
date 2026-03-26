const { PrismaClient } = require('@prisma/client');

// Singleton pattern: reuse the same client instance across hot-module reloads
// (relevant in development with nodemon). In production there is only one
// instance anyway, but the globalThis guard prevents accidental duplicate
// connections if this module is ever required by multiple entry points.
const globalForPrisma = globalThis;

if (!globalForPrisma.__prisma) {
  globalForPrisma.__prisma = new PrismaClient({
    // In development, log queries to aid debugging.
    // In production, suppress query/info logs — only surface warnings and errors.
    log: process.env.NODE_ENV === 'production'
      ? ['warn', 'error']
      : ['query', 'warn', 'error'],
  });
}

const prisma = globalForPrisma.__prisma;

module.exports = prisma;
