const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const name = process.argv[2];
  const slug = process.argv[3];

  if (!name || !slug) {
    console.error('Usage: node scripts/add-org.js "Org Name" org-slug');
    console.error('Example: node scripts/add-org.js "Hope Foundation" hope-foundation');
    process.exit(1);
  }

  // slug must be lowercase letters, numbers, and hyphens only
  if (!/^[a-z0-9-]+$/.test(slug)) {
    console.error('Error: slug must contain only lowercase letters, numbers, and hyphens.');
    process.exit(1);
  }

  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) {
    console.error(`Error: slug "${slug}" is already taken.`);
    process.exit(1);
  }

  const org = await prisma.organization.create({
    data: { name, slug, isActive: true },
  });

  console.log('');
  console.log('Organization created successfully!');
  console.log('  Name: ' + org.name);
  console.log('  Slug: ' + org.slug);
  console.log('  ID:   ' + org.id);
  console.log('');
  console.log('Intake URL: /apply/' + org.slug);
  console.log('Status URL: /status/' + org.slug);
  console.log('');
  console.log('Share the intake URL with applicants.');
  console.log('Create staff accounts via User Management in the admin dashboard.');
}

main()
  .catch((e) => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
