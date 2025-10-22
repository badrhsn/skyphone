const { PrismaClient } = require('@prisma/client');

async function verifyDBStructure() {
  const prisma = new PrismaClient();
  
  try {
    // Try to find a record and check its structure
    const sampleRecord = await prisma.callRate.findFirst();
    console.log('Sample CallRate record structure:', Object.keys(sampleRecord || {}));
    
    // Try to access flag field specifically
    const recordWithFlag = await prisma.callRate.findFirst({
      where: { flag: { not: null } }
    });
    
    if (recordWithFlag) {
      console.log('✅ Flag field exists and has data:', recordWithFlag.flag);
      console.log('Record details:', {
        country: recordWithFlag.country,
        flag: recordWithFlag.flag,
        countryCode: recordWithFlag.countryCode
      });
    } else {
      console.log('⚠️ No records found with flag data');
    }
    
  } catch (error) {
    console.error('❌ Error accessing database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDBStructure();
