import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create initial call rates
  const rates = [
    { country: 'United States', countryCode: '+1', rate: 0.02, currency: 'USD' },
    { country: 'United Kingdom', countryCode: '+44', rate: 0.03, currency: 'USD' },
    { country: 'Germany', countryCode: '+49', rate: 0.025, currency: 'USD' },
    { country: 'France', countryCode: '+33', rate: 0.025, currency: 'USD' },
    { country: 'Japan', countryCode: '+81', rate: 0.04, currency: 'USD' },
    { country: 'Australia', countryCode: '+61', rate: 0.035, currency: 'USD' },
    { country: 'Canada', countryCode: '+1', rate: 0.02, currency: 'USD' },
    { country: 'India', countryCode: '+91', rate: 0.015, currency: 'USD' },
    { country: 'China', countryCode: '+86', rate: 0.03, currency: 'USD' },
    { country: 'Brazil', countryCode: '+55', rate: 0.025, currency: 'USD' },
    { country: 'Mexico', countryCode: '+52', rate: 0.02, currency: 'USD' },
    { country: 'Russia', countryCode: '+7', rate: 0.03, currency: 'USD' },
    { country: 'South Korea', countryCode: '+82', rate: 0.035, currency: 'USD' },
    { country: 'Italy', countryCode: '+39', rate: 0.025, currency: 'USD' },
    { country: 'Spain', countryCode: '+34', rate: 0.025, currency: 'USD' },
  ]

  for (const rate of rates) {
    await prisma.callRate.upsert({
      where: { countryCode: rate.countryCode },
      update: rate,
      create: rate,
    })
  }

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
