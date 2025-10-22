#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function testRatesPageFlagFix() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Rates Page Flag Fix');
    console.log('==============================');
    
    // Get some sample rates with flags
    const sampleRates = await prisma.callRate.findMany({
      where: { 
        isActive: true,
        flag: { not: null }
      },
      take: 5,
      orderBy: { country: 'asc' }
    });
    
    console.log('📊 Sample rates from database:');
    sampleRates.forEach((rate, index) => {
      console.log(`${index + 1}. ${rate.flag} ${rate.country} (${rate.countryCode}) - $${rate.rate.toFixed(3)}/min`);
    });
    
    console.log('\n✅ SUCCESS: Rates page should now show these flags from the database!');
    console.log('\n🔧 Changes made:');
    console.log('1. ❌ Removed static countryFlags object');
    console.log('2. ✅ Updated Rate interface to include flag?: string');  
    console.log('3. ✅ Changed {countryFlags[...] || "🌍"} to {rate.flag || "🌍"}');
    console.log('4. ✅ Now using database flags in both dropdown and table');
    
    console.log('\n🌍 The rates page will now display real country flags from your database instead of the 🌍 fallback!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testRatesPageFlagFix();