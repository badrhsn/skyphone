import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create initial call rates
  const rates = [
    { country: 'United States', countryCode: '+1', rate: 0.04, currency: 'USD' },        // Increased from $0.02
    { country: 'United Kingdom', countryCode: '+44', rate: 0.05, currency: 'USD' },      // Increased from $0.03
    { country: 'Germany', countryCode: '+49', rate: 0.045, currency: 'USD' },            // Increased from $0.025
    { country: 'France', countryCode: '+33', rate: 0.045, currency: 'USD' },             // Increased from $0.025
    { country: 'Japan', countryCode: '+81', rate: 0.06, currency: 'USD' },               // Increased from $0.04
    { country: 'Australia', countryCode: '+61', rate: 0.055, currency: 'USD' },          // Increased from $0.035
    { country: 'Canada', countryCode: '+1', rate: 0.04, currency: 'USD' },               // Increased from $0.02
    { country: 'India', countryCode: '+91', rate: 0.025, currency: 'USD' },              // Increased from $0.015
    { country: 'China', countryCode: '+86', rate: 0.05, currency: 'USD' },               // Increased from $0.03
    { country: 'Brazil', countryCode: '+55', rate: 0.045, currency: 'USD' },             // Increased from $0.025
    { country: 'Mexico', countryCode: '+52', rate: 0.04, currency: 'USD' },              // Increased from $0.02
    { country: 'Russia', countryCode: '+7', rate: 0.05, currency: 'USD' },               // Increased from $0.03
    { country: 'South Korea', countryCode: '+82', rate: 0.055, currency: 'USD' },        // Increased from $0.035
    { country: 'Italy', countryCode: '+39', rate: 0.045, currency: 'USD' },              // Increased from $0.025
    { country: 'Spain', countryCode: '+34', rate: 0.045, currency: 'USD' },              // Increased from $0.025
  ]

  for (const rate of rates) {
    // Use composite unique (countryCode + callerIdCountry) per Prisma schema
    await prisma.callRate.upsert({
      where: {
        countryCode_callerIdCountry: {
          countryCode: rate.countryCode,
          callerIdCountry: rate.countryCode,
        }
      },
      update: {
        country: rate.country,
        rate: rate.rate,
        currency: rate.currency,
        updatedAt: new Date(),
      },
      create: {
        country: rate.country,
        countryCode: rate.countryCode,
        callerIdCountry: rate.countryCode,
        rate: rate.rate,
        currency: rate.currency,
        isActive: true,
      },
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
