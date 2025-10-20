const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAdminFunctionalities() {
  console.log('🧪 Testing Admin Dashboard Functionalities...\n');

  try {
    // Test 1: Check if we have sample data
    console.log('1️⃣ Checking sample data availability:');
    const userCount = await prisma.user.count();
    const callCount = await prisma.call.count();
    const paymentCount = await prisma.payment.count();
    const rateCount = await prisma.callRate.count();
    
    console.log(`   Users: ${userCount}`);
    console.log(`   Calls: ${callCount}`);
    console.log(`   Payments: ${paymentCount}`);
    console.log(`   Rates: ${rateCount}`);

    // Test 2: Check provider status data
    console.log('\n2️⃣ Checking provider status:');
    const providerCount = await prisma.providerStatus.count();
    console.log(`   Providers: ${providerCount}`);
    
    if (providerCount === 0) {
      console.log('   ⚠️  No provider status data found - this will cause 404 errors');
      console.log('   Creating default provider status entries...');
      
      const providers = ['twilio', 'telnyx', 'vonage'];
      for (const provider of providers) {
        await prisma.providerStatus.create({
          data: {
            provider,
            isActive: provider === 'twilio',
            successRate: 100.0,
            avgResponseTime: 250,
          }
        });
      }
      console.log('   ✅ Created default provider status entries');
    }

    // Test 3: Check if we have admin user
    console.log('\n3️⃣ Checking admin user:');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@yadaphone.com' },
      select: { email: true, isAdmin: true, balance: true }
    });
    
    if (adminUser) {
      console.log(`   ✅ Admin user found: ${adminUser.email} (isAdmin: ${adminUser.isAdmin})`);
    } else {
      console.log('   ❌ Admin user not found');
    }

    // Test 4: Check for calls with completed status
    console.log('\n4️⃣ Checking refundable calls:');
    const completedCalls = await prisma.call.count({
      where: { status: 'COMPLETED' }
    });
    console.log(`   Completed calls available for refund: ${completedCalls}`);

    // Test 5: Check for completed payments
    console.log('\n5️⃣ Checking refundable payments:');
    const completedPayments = await prisma.payment.count({
      where: { status: 'COMPLETED' }
    });
    console.log(`   Completed payments available for refund: ${completedPayments}`);

    // Test 6: Check for non-admin users
    console.log('\n6️⃣ Checking manageable users:');
    const regularUsers = await prisma.user.count({
      where: { 
        AND: [
          { isAdmin: false },
          { email: { not: 'admin@yadaphone.com' } }
        ]
      }
    });
    console.log(`   Regular users available for management: ${regularUsers}`);

    // Test 7: Show recent activity
    console.log('\n7️⃣ Recent activity:');
    const recentCalls = await prisma.call.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    });
    
    if (recentCalls.length > 0) {
      console.log('   Recent calls:');
      recentCalls.forEach(call => {
        console.log(`   - ${call.user.name}: ${call.fromNumber} → ${call.toNumber} (${call.status})`);
      });
    } else {
      console.log('   No calls found');
    }

    console.log('\n✅ Admin functionality test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminFunctionalities();