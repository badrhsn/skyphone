const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('Connected to DB. Altering enum-typed columns to use PascalCase enum types...');

    // Alter CallAnalytics.status from callanalyticsstatus -> CallAnalyticsStatus
    console.log('Altering CallAnalytics.status to "CallAnalyticsStatus"');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "CallAnalytics" ALTER COLUMN "status" TYPE "CallAnalyticsStatus" USING "status"::text::"CallAnalyticsStatus";'
    );

    // Alter CallerID.status from calleridstatus -> CallerIDStatus
    console.log('Altering CallerID.status to "CallerIDStatus"');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "CallerID" ALTER COLUMN "status" TYPE "CallerIDStatus" USING "status"::text::"CallerIDStatus";'
    );

    console.log('Altering complete.');

    // Test the problematic query
    console.log('Running test count query for callAnalytics...');
    const totalCalls = await prisma.callAnalytics.count();
    const successfulCalls = await prisma.callAnalytics.count({
      where: {
        status: { in: ['SUCCESS', 'FAILOVER_SUCCESS'] }
      }
    });

    console.log('totalCalls:', totalCalls, 'successfulCalls:', successfulCalls);
  } catch (err) {
    console.error('Error while altering enums or testing:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
