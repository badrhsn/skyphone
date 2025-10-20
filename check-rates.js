// Check rates in database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRates() {
  console.log('🔍 Checking Rates Database\n');

  try {
    // Test 1: Check total rates
    console.log('1️⃣ Total rates in database:');
    const totalRates = await prisma.callRate.count();
    console.log(`   Total: ${totalRates}`);

    // Test 2: Check active rates
    console.log('\n2️⃣ Active rates:');
    const activeRates = await prisma.callRate.count({
      where: { isActive: true }
    });
    console.log(`   Active: ${activeRates}`);

    // Test 3: Check inactive rates
    console.log('\n3️⃣ Inactive rates:');
    const inactiveRates = await prisma.callRate.count({
      where: { isActive: false }
    });
    console.log(`   Inactive: ${inactiveRates}`);

    // Test 4: Show sample of rates
    console.log('\n4️⃣ Sample rates:');
    const sampleRates = await prisma.callRate.findMany({
      take: 5,
      orderBy: { country: 'asc' },
      select: { country: true, countryCode: true, rate: true, isActive: true }
    });
    
    sampleRates.forEach(rate => {
      console.log(`   ${rate.country} (${rate.countryCode}): $${rate.rate}/min - ${rate.isActive ? 'Active' : 'Inactive'}`);
    });

    // Test 5: Check unique countries
    console.log('\n5️⃣ Unique countries:');
    const uniqueCountries = await prisma.callRate.groupBy({
      by: ['country'],
      where: { isActive: true },
      _count: { country: true }
    });
    
    console.log(`   Unique active countries: ${uniqueCountries.length}`);
    
    if (uniqueCountries.length === 0) {
      console.log('\n❌ PROBLEM FOUND: No active rates!');
      console.log('   All rates might be set to inactive. Let me fix this...');
      
      // Activate all rates
      const updated = await prisma.callRate.updateMany({
        data: { isActive: true }
      });
      
      console.log(`   ✅ Updated ${updated.count} rates to active status`);
      
      // Verify
      const nowActiveRates = await prisma.callRate.count({
        where: { isActive: true }
      });
      console.log(`   ✅ Now active rates: ${nowActiveRates}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRates();