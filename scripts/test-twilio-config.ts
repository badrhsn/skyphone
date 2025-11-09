import { PrismaClient } from '@prisma/client'
import { secureConfig } from '../src/lib/secure-config'
import { getTwilioClient } from '../src/lib/twilio'

const prisma = new PrismaClient()

async function testTwilioConfig() {
  console.log('🔍 Testing Twilio Configuration...\n')

  try {
    // 1. Check if we can decrypt the Twilio config from database
    console.log('1. Fetching Twilio configuration from database...')
    const twilioConfig = await secureConfig.getConfig('TWILIO')
    
    if (!twilioConfig) {
      console.log('❌ Failed to retrieve Twilio configuration from database')
      return
    }
    
    console.log('✅ Successfully retrieved Twilio configuration')
    console.log('   Configuration keys found:', Object.keys(twilioConfig))
    
    // Check for required fields
    const requiredFields = ['accountSid', 'authToken', 'phoneNumber']
    const missingFields = requiredFields.filter(field => !twilioConfig[field])
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required Twilio configuration fields:', missingFields)
      return
    }
    
    console.log('✅ All required Twilio configuration fields present')
    console.log(`   Account SID: ${String(twilioConfig.accountSid).substring(0, 10)}...`)
    console.log(`   Phone Number: ${twilioConfig.phoneNumber}`)

    // 2. Test Twilio client initialization
    console.log('\n2. Testing Twilio client initialization...')
    const client = await getTwilioClient()
    
    if (!client) {
      console.log('❌ Failed to initialize Twilio client')
      return
    }
    
    console.log('✅ Twilio client initialized successfully')

    // 3. Test Twilio API connection
    console.log('\n3. Testing Twilio API connection...')
    
    try {
      const account = await client.api.accounts(twilioConfig.accountSid).fetch()
      console.log('✅ Successfully connected to Twilio API')
      console.log(`   Account Status: ${account.status}`)
      console.log(`   Account Type: ${account.type}`)
      console.log(`   Date Created: ${account.dateCreated}`)
    } catch (apiError: any) {
      console.log('❌ Failed to connect to Twilio API')
      console.log('   Error:', apiError.message)
      
      if (apiError.code) {
        console.log('   Error Code:', apiError.code)
      }
      
      if (apiError.status) {
        console.log('   HTTP Status:', apiError.status)
      }
      return
    }

    // 4. Test phone number validation
    console.log('\n4. Testing phone number configuration...')
    
    try {
      const phoneNumbers = await client.incomingPhoneNumbers.list({ limit: 1 })
      
      if (phoneNumbers.length === 0) {
        console.log('⚠️  No phone numbers found in Twilio account')
        console.log('   You need to purchase a phone number to make calls')
      } else {
        console.log('✅ Phone numbers found in Twilio account')
        console.log(`   Available numbers: ${phoneNumbers.length}`)
        console.log(`   First number: ${phoneNumbers[0].phoneNumber}`)
      }
    } catch (phoneError: any) {
      console.log('❌ Failed to fetch phone numbers')
      console.log('   Error:', phoneError.message)
    }

    // 5. Test webhook URL configuration
    console.log('\n5. Testing webhook configuration...')
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice`
    console.log(`   Expected webhook URL: ${webhookUrl}`)
    
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.log('⚠️  NEXT_PUBLIC_APP_URL not set - webhooks may not work')
    } else {
      console.log('✅ Webhook URL configured')
    }

    // 6. Update last used timestamp
    console.log('\n6. Updating configuration last used timestamp...')
    await prisma.apiConfiguration.update({
      where: { provider: 'TWILIO' },
      data: { lastUsed: new Date() }
    })
    console.log('✅ Configuration timestamp updated')

    console.log('\n🎉 Twilio configuration test completed successfully!')
    console.log('   If calls are still failing, the issue might be with:')
    console.log('   - Phone number permissions')
    console.log('   - Webhook URL accessibility')
    console.log('   - Call routing logic')

  } catch (error: any) {
    console.error('❌ Error testing Twilio configuration:', error)
    
    if (error.message.includes('decrypt')) {
      console.log('\n💡 Decryption error detected.')
      console.log('   Check if CONFIG_ENCRYPTION_KEY environment variable is set correctly.')
    }
    
    if (error.message.includes('connect')) {
      console.log('\n💡 Database connection error detected.')
      console.log('   Check your Supabase database connection.')
    }
  }
}

console.log('Twilio Configuration Tester')
console.log('===========================')
console.log('')

testTwilioConfig()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })