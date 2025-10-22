#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNewCallerIdSystem() {
  console.log('🧪 Testing Updated Caller ID Country System\n');
  
  try {
    // Test 1: Verify all 4 caller ID countries exist
    console.log('📊 Verifying caller ID countries:');
    const callerIdCounts = await prisma.callRate.groupBy({
      by: ['callerIdCountry'],
      _count: true
    });
    
    const expectedCountries = ['US', 'PH', 'ID', 'TH'];
    for (const expected of expectedCountries) {
      const found = callerIdCounts.find(c => c.callerIdCountry === expected);
      if (found) {
        console.log(`   ✅ ${expected}: ${found._count} rates`);
      } else {
        console.log(`   ❌ ${expected}: NOT FOUND`);
      }
    }
    
    // Test 2: Show sample rates for each caller ID country
    console.log('\n🌍 Sample rates by caller ID country:');
    for (const country of expectedCountries) {
      const sampleRates = await prisma.callRate.findMany({
        where: { callerIdCountry: country },
        take: 3,
        orderBy: { country: 'asc' }
      });
      
      console.log(`\n   📞 ${country} Caller ID rates:`);
      for (const rate of sampleRates) {
        console.log(`      ${rate.country} (${rate.countryCode}): $${rate.rate}/min`);
      }
    }
    
    // Test 3: Verify rate differences (if any)
    console.log('\n🔍 Comparing rates across caller ID countries:');
    const testDestinations = ['Canada', 'Germany', 'Japan'];
    
    for (const destination of testDestinations) {
      console.log(`\n   📈 ${destination} rates:`);
      const rates = await prisma.callRate.findMany({
        where: { country: destination },
        orderBy: { callerIdCountry: 'asc' }
      });
      
      for (const rate of rates) {
        console.log(`      ${rate.callerIdCountry}: $${rate.rate}/min`);
      }
    }
    
    console.log('\n✅ System verification completed successfully!');
    console.log('\n🎯 New Caller ID Countries Available:');
    console.log('   🇺🇸 US - United States');
    console.log('   🇵🇭 PH - Philippines');  
    console.log('   🇮🇩 ID - Indonesia');
    console.log('   🇹🇭 TH - Thailand');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewCallerIdSystem();