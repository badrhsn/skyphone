const { PrismaClient } = require('@prisma/client');

(async () => {
  const p = new PrismaClient();
  try {
    await p.$connect();
    const res = await p.$queryRaw`
      SELECT c.relname as table_name, a.attname as column_name, t.typname as type_name
      FROM pg_attribute a
      JOIN pg_class c ON a.attrelid = c.oid
      JOIN pg_type t ON a.atttypid = t.oid
      WHERE a.attnum > 0 AND NOT a.attisdropped
        AND (c.relname ILIKE '%payment%')
      ORDER BY c.relname, a.attnum;
    `;
    console.dir(res, { depth: null });
  } catch (err) {
    console.error(err);
  } finally {
    await p.$disconnect();
  }
})();
