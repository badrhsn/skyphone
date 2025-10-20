const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleData() {
  try {
    console.log('Creating sample data...');

    // Get a regular user (not admin)
    const regularUser = await prisma.user.findFirst({
      where: { 
        isAdmin: false,
        email: { not: 'admin@yadaphone.com' }
      }
    });

    if (!regularUser) {
      console.log('No regular user found, creating one...');
      const newUser = await prisma.user.create({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          balance: 25.50,
          isAdmin: false
        }
      });
      regularUser = newUser;
    }

    // Create sample calls
    const sampleCalls = [
      {
        userId: regularUser.id,
        fromNumber: '+1234567890',
        toNumber: '+447123456789',
        country: 'United Kingdom',
        duration: 180, // 3 minutes
        cost: 0.54,
        status: 'COMPLETED',
        twilioSid: 'CA1234567890abcdef',
        endedAt: new Date()
      },
      {
        userId: regularUser.id,
        fromNumber: '+1234567890',
        toNumber: '+33123456789',
        country: 'France',
        duration: 240, // 4 minutes
        cost: 0.72,
        status: 'COMPLETED',
        twilioSid: 'CA1234567890abcdefg',
        endedAt: new Date()
      },
      {
        userId: regularUser.id,
        fromNumber: '+1234567890',
        toNumber: '+49123456789',
        country: 'Germany',
        duration: 0,
        cost: 0.00,
        status: 'FAILED',
        twilioSid: null
      }
    ];

    for (const call of sampleCalls) {
      await prisma.call.create({ data: call });
    }

    // Create sample payments
    const samplePayments = [
      {
        userId: regularUser.id,
        amount: 10.00,
        currency: 'USD',
        status: 'COMPLETED',
        stripePaymentId: 'pi_1234567890abcdef',
        stripeSessionId: 'cs_1234567890abcdef'
      },
      {
        userId: regularUser.id,
        amount: 25.00,
        currency: 'USD',
        status: 'COMPLETED',
        stripePaymentId: 'pi_0987654321fedcba',
        stripeSessionId: 'cs_0987654321fedcba'
      },
      {
        userId: regularUser.id,
        amount: 5.00,
        currency: 'USD',
        status: 'FAILED',
        stripePaymentId: null,
        stripeSessionId: 'cs_failed123456'
      }
    ];

    for (const payment of samplePayments) {
      await prisma.payment.create({ data: payment });
    }

    console.log('Sample data created successfully!');
    console.log(`Created calls and payments for user: ${regularUser.email}`);

  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData();