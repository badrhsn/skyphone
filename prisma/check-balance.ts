import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkBalance() {
  const email = process.argv[2]

  if (!email) {
    // If no email provided, show all users and their balances
    console.log('📊 All users and their balances:')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        balance: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (users.length === 0) {
      console.log('No users found!')
      return
    }

    console.log('\n┌─────────────────────────────────────────────┬─────────────┬─────────┐')
    console.log('│ Email                                       │ Balance     │ Admin   │')
    console.log('├─────────────────────────────────────────────┼─────────────┼─────────┤')
    
    users.forEach(user => {
      const email = user.email.padEnd(43)
      const balance = `$${user.balance.toFixed(2)}`.padStart(11)
      const isAdmin = (user.isAdmin ? 'Yes' : 'No').padEnd(7)
      console.log(`│ ${email} │ ${balance} │ ${isAdmin} │`)
    })
    
    console.log('└─────────────────────────────────────────────┴─────────────┴─────────┘')
    
  } else {
    // Check specific user balance
    console.log(`Checking balance for: ${email}`)

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        balance: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            calls: true,
            payments: true,
          }
        }
      },
    })

    if (!user) {
      console.error(`❌ User with email ${email} not found!`)
      process.exit(1)
    }

    console.log('\n📋 User Details:')
    console.log(`Name: ${user.name || 'N/A'}`)
    console.log(`Email: ${user.email}`)
    console.log(`Balance: $${user.balance.toFixed(2)}`)
    console.log(`Admin: ${user.isAdmin ? 'Yes' : 'No'}`)
    console.log(`Total Calls: ${user._count.calls}`)
    console.log(`Total Payments: ${user._count.payments}`)
    console.log(`Created: ${user.createdAt.toISOString()}`)
    console.log(`Updated: ${user.updatedAt.toISOString()}`)
  }
}

console.log('Usage:')
console.log('  npm run check-balance                    # Show all users')
console.log('  npm run check-balance <email>           # Check specific user')
console.log('')

checkBalance()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })