import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addBalance() {
  // Get email and amount from command line arguments
  const email = process.argv[2]
  const amount = parseFloat(process.argv[3])

  if (!email || !amount || isNaN(amount)) {
    console.log('Usage: npm run add-balance <email> <amount>')
    console.log('Example: npm run add-balance test@yadaphone.com 25.50')
    process.exit(1)
  }

  try {
    console.log(`Adding $${amount} to user: ${email}`)

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.error(`❌ User with email ${email} not found!`)
      process.exit(1)
    }

    console.log(`Current balance: $${user.balance}`)

    // Update the user's balance
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        balance: {
          increment: amount
        },
        updatedAt: new Date()
      },
    })

    console.log(`✅ Balance updated successfully!`)
    console.log(`Previous balance: $${user.balance}`)
    console.log(`Amount added: $${amount}`)
    console.log(`New balance: $${updatedUser.balance}`)

  } catch (error) {
    console.error('❌ Error adding balance:', error)
    process.exit(1)
  }
}

addBalance()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })