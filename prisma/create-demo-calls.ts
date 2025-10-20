import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createDemoCalls() {
  console.log('Creating demo calls...')

  // Find or create a test user
  const testUser = await prisma.user.upsert({
    where: { email: 'demo@yadaphone.com' },
    update: {},
    create: {
      email: 'demo@yadaphone.com',
      name: 'Demo User',
      balance: 50.00,
    },
  })

  // Create some demo calls
  const demoCalls = [
    {
      userId: testUser.id,
      fromNumber: '+1234567890',
      toNumber: '+44987654321',
      country: 'United Kingdom',
      duration: 180, // 3 minutes
      cost: 0.09, // 3 * 0.03
      status: 'COMPLETED' as const,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      endedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 180000),
    },
    {
      userId: testUser.id,
      fromNumber: '+1234567890',
      toNumber: '+49123456789',
      country: 'Germany',
      duration: 120, // 2 minutes
      cost: 0.05, // 2 * 0.025
      status: 'COMPLETED' as const,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      endedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 120000),
    },
    {
      userId: testUser.id,
      fromNumber: '+1234567890',
      toNumber: '+91987654321',
      country: 'India',
      duration: 0, // Failed call
      cost: 0,
      status: 'FAILED' as const,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      userId: testUser.id,
      fromNumber: '+1234567890',
      toNumber: '+33123456789',
      country: 'France',
      duration: 300, // 5 minutes
      cost: 0.125, // 5 * 0.025
      status: 'COMPLETED' as const,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      endedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 300000),
    },
  ]

  for (const call of demoCalls) {
    await prisma.call.create({
      data: call,
    })
  }

  console.log('✅ Demo calls created successfully!')
  console.log(`Created ${demoCalls.length} demo calls for user: ${testUser.email}`)
}

createDemoCalls()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })