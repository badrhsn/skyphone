import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearAuthSessions() {
  console.log('Clearing auth sessions and accounts...')

  // Clear existing sessions and accounts to fix OAuth issues
  await prisma.session.deleteMany({})
  await prisma.account.deleteMany({})

  console.log('✅ Auth sessions cleared successfully!')
  console.log('You can now try Google authentication again.')
}

clearAuthSessions()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })