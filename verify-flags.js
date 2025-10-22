const { PrismaClient } = require('@prisma/client');

async function verifyFlags() {
  const prisma = new PrismaClient();
  
  try {
    const totalRecords = await prisma.callRate.count();
    const recordsWithFlags = await prisma.callRate.count({
      where: {
        flag: {
          not: null
        }
      }
    });
    
    const coverage = (recordsWithFlags / totalRecords * 100).toFixed(1);
    
    console.log('📊 Final Verification:');
    console.log('====================');
    console.log(`📝 Total records: ${totalRecords}`);
    console.log(`🎌 Records with flags: ${recordsWithFlags}`);
    console.log(`📈 Coverage: ${coverage}%`);
    
    if (recordsWithFlags === totalRecords) {
      console.log('🎉 SUCCESS: All CallRate records now have flags!');
    } else {
      const missing = totalRecords - recordsWithFlags;
      console.log(`⚠️  Still missing flags: ${missing} records`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyFlags();
