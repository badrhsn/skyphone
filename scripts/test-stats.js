const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('Running test counts...');
    const total = await prisma.callAnalytics.count();
    const success = await prisma.callAnalytics.count({ where: { status: { in: ['SUCCESS', 'FAILOVER_SUCCESS'] } } });
    console.log({ total, success });
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
