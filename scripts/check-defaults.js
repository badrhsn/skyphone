const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    const q = `
      SELECT table_name, column_name, column_default
      FROM information_schema.columns
      WHERE table_name IN ('CallAnalytics', 'CallerID') AND column_name = 'status';
    `;
    const res = await prisma.$queryRawUnsafe(q);
    console.log(res);
  } catch (err) {
    console.error('Error fetching defaults:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
