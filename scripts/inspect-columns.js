const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('Connected to DB. Getting columns for tables with "call" in the name...');

    const cols = await prisma.$queryRaw`
      SELECT c.relname as table_name, a.attname as column_name, t.typname as type_name
      FROM pg_attribute a
      JOIN pg_class c ON a.attrelid = c.oid
      JOIN pg_type t ON a.atttypid = t.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE a.attnum > 0 AND NOT a.attisdropped
        AND (c.relname ILIKE '%call%')
      ORDER BY c.relname, a.attnum;
    `;

    console.dir(cols, { depth: null });
  } catch (err) {
    console.error('Error querying columns:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
