const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('Connected. Repairing CallerID.status enum column...');

    // Drop default
    console.log('Dropping default on CallerID.status');
    await prisma.$executeRawUnsafe('ALTER TABLE "CallerID" ALTER COLUMN "status" DROP DEFAULT;');

    // Alter column
    console.log('Altering CallerID.status to "CallerIDStatus" type');
    await prisma.$executeRawUnsafe('ALTER TABLE "CallerID" ALTER COLUMN "status" TYPE "CallerIDStatus" USING "status"::text::"CallerIDStatus";');

    // Restore default
    console.log('Setting default to "PENDING"::"CallerIDStatus"');
    await prisma.$executeRawUnsafe('ALTER TABLE "CallerID" ALTER COLUMN "status" SET DEFAULT \'' + 'PENDING' + "'::\"CallerIDStatus\";");

    console.log('Repair finished.');
  } catch (err) {
    console.error('Error repairing CallerID enum:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
