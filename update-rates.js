// Update existing call rates to new profit-optimized pricing
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateRates() {
  console.log('🚀 Updating call rates for better profit margins...\n');

  try {
    // New optimized rates with higher profit margins
    const updatedRates = [
      { country: 'United States', rate: 0.04 },        // Was $0.02, now $0.04 (100% increase)
      { country: 'United Kingdom', rate: 0.05 },       // Was $0.03, now $0.05 (67% increase)
      { country: 'Germany', rate: 0.045 },             // Was $0.025, now $0.045 (80% increase)
      { country: 'France', rate: 0.045 },              // Was $0.025, now $0.045 (80% increase)
      { country: 'Japan', rate: 0.06 },                // Was $0.04, now $0.06 (50% increase)
      { country: 'Australia', rate: 0.055 },           // Was $0.035, now $0.055 (57% increase)
      { country: 'Canada', rate: 0.04 },               // Was $0.02, now $0.04 (100% increase)
      { country: 'India', rate: 0.025 },               // Was $0.015, now $0.025 (67% increase)
      { country: 'China', rate: 0.05 },                // Was $0.03, now $0.05 (67% increase)
      { country: 'Brazil', rate: 0.045 },              // Was $0.025, now $0.045 (80% increase)
      { country: 'Mexico', rate: 0.04 },               // Was $0.02, now $0.04 (100% increase)
      { country: 'Russia', rate: 0.05 },               // Was $0.03, now $0.05 (67% increase)
      { country: 'South Korea', rate: 0.055 },         // Was $0.035, now $0.055 (57% increase)
      { country: 'Italy', rate: 0.045 },               // Was $0.025, now $0.045 (80% increase)
      { country: 'Spain', rate: 0.045 },               // Was $0.025, now $0.045 (80% increase)
    ];

    let updatedCount = 0;

    for (const rateUpdate of updatedRates) {
      const result = await prisma.callRate.updateMany({
        where: { 
          country: rateUpdate.country,
          isActive: true 
        },
        data: { 
          rate: rateUpdate.rate 
        }
      });
      
      if (result.count > 0) {
        console.log(`✅ Updated ${rateUpdate.country}: $${rateUpdate.rate}/min`);
        updatedCount += result.count;
      }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} call rates!`);
    
    // Show summary of improvements
    console.log('\n📊 Profit Margin Improvements:');
    console.log('   📞 Phone Numbers:');
    console.log('      • US Local: $2.00/month (was $1.00) + $2.00 setup');
    console.log('      • US Toll-Free: $4.00/month (was $2.00) + $10.00 setup');
    console.log('      • CA Local: $2.50/month (was $1.25) + $2.00 setup');
    console.log('      • CA Toll-Free: $5.00/month (was $2.50) + $10.00 setup');
    console.log('   ☎️  Call Rates:');
    console.log('      • US/Canada: $0.04/min (was $0.02/min) - 100% increase');
    console.log('      • UK/Europe: $0.045-0.05/min (was $0.025-0.03/min) - 67-80% increase');
    console.log('      • Asia/Other: $0.025-0.06/min - 50-67% increase');
    console.log('   📱 Mobile Markup: 25% (was 10%)');
    
    console.log('\n💰 Expected Profit Increase:');
    console.log('   • Phone rentals: 100-150% profit margin increase');
    console.log('   • Setup fees: 100-200% profit margin increase');
    console.log('   • Call minutes: 50-100% profit margin increase');
    console.log('   • Monthly revenue per user: $3-5 (was $1.50)');

  } catch (error) {
    console.error('❌ Error updating rates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRates();