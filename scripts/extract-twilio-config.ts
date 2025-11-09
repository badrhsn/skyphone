import { PrismaClient } from '@prisma/client'
import { secureConfig } from '../src/lib/secure-config'

const prisma = new PrismaClient()

async function extractTwilioConfig() {
  console.log('🔍 Extracting Twilio configuration from database...\n')

  try {
    // Get Twilio config from database
    const twilioConfig = await secureConfig.getConfig('TWILIO')
    
    if (!twilioConfig) {
      console.log('❌ No Twilio configuration found in database')
      return
    }
    
    console.log('✅ Found Twilio configuration!')
    console.log('\nAdd these to your .env file:')
    console.log('=' .repeat(50))
    console.log(`TWILIO_ACCOUNT_SID="${twilioConfig.accountSid}"`)
    console.log(`TWILIO_AUTH_TOKEN="${twilioConfig.authToken}"`)
    console.log(`TWILIO_PHONE_NUMBER="${twilioConfig.phoneNumber}"`)
    console.log('=' .repeat(50))
    
    console.log('\nThese credentials will be used instead of the database configuration.')
    console.log('This will make deployment much simpler!')

  } catch (error: any) {
    console.error('❌ Error extracting Twilio configuration:', error)
    
    if (error.message.includes('decrypt')) {
      console.log('\n💡 Decryption error - this might be due to the encryption key.')
      console.log('   But that\'s okay, we\'re moving away from encrypted config!')
    }
  }
}

console.log('Twilio Configuration Extractor')
console.log('==============================')
console.log('')

extractTwilioConfig()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })