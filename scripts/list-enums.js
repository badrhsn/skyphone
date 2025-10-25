const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('Listing all enum types and labels...');
    const res = await prisma.$queryRaw`
      SELECT n.nspname as schema, t.typname as enum_type, array_agg(e.enumlabel ORDER BY e.enumsortorder) as labels
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      GROUP BY t.typname, n.nspname
      ORDER BY t.typname;
    `;
    console.dir(res, { depth: null });
  } catch (err) {
    console.error('Error listing enums:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
