import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  console.log('Creating test user...')

  // Create a test user
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const user = await prisma.user.upsert({
    where: { email: 'test@yadaphone.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'test@yadaphone.com',
      password: hashedPassword,
      balance: 10.00, // Give them $10 credit
      isAdmin: false,
    },
  })

  // Create an admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@yadaphone.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@yadaphone.com',
      password: hashedPassword,
      balance: 100.00,
      isAdmin: true,
    },
  })

  console.log('✅ Test users created successfully!')
  console.log('📧 Test User: test@yadaphone.com / password123')
  console.log('👑 Admin User: admin@yadaphone.com / password123')
}

createTestUser()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
