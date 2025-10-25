const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('Connected to DB. Running enum inspection...');

    const enums = await prisma.$queryRaw`
      SELECT n.nspname as schema, t.typname as enum_type, e.enumlabel as enum_value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname ILIKE '%call%'
      ORDER BY t.typname, e.enumsortorder;
    `;

    if (enums.length === 0) {
      console.log('No enum types matching "call" found. Listing all enums...');
      const allEnums = await prisma.$queryRaw`
        SELECT n.nspname as schema, t.typname as enum_type, e.enumlabel as enum_value
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        ORDER BY t.typname, e.enumsortorder;
      `;
      console.dir(allEnums, { depth: null });
    } else {
      console.dir(enums, { depth: null });
    }
  } catch (err) {
    console.error('Error querying enums:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
