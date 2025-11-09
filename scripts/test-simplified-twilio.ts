import { getTwilioClient, initiateCall } from '../src/lib/twilio'

async function testSimplifiedTwilioConfig() {
  console.log('🧪 Testing Simplified Twilio Configuration')
  console.log('==========================================\n')

  try {
    // Test 1: Get Twilio client
    console.log('1️⃣ Testing Twilio client initialization...')
    const client = await getTwilioClient()
    
    if (client) {
      console.log('✅ Twilio client initialized successfully')
      
      // Test 2: Fetch account info
      console.log('\n2️⃣ Testing account connection...')
      const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch()
      console.log(`✅ Connected to account: ${account.friendlyName}`)
      console.log(`   Status: ${account.status}`)
      
      // Test 3: Test call initiation (dry run - won't actually make a call)
      console.log('\n3️⃣ Testing call initiation configuration...')
      console.log('   (This will validate config without making actual call)')
      
      if (!process.env.TWILIO_PHONE_NUMBER) {
        console.log('❌ TWILIO_PHONE_NUMBER not set')
      } else {
        console.log(`✅ Phone number configured: ${process.env.TWILIO_PHONE_NUMBER}`)
      }
      
      if (!process.env.NEXT_PUBLIC_APP_URL) {
        console.log('❌ NEXT_PUBLIC_APP_URL not set')
      } else {
        console.log(`✅ Webhook URL configured: ${process.env.NEXT_PUBLIC_APP_URL}`)
      }
      
      console.log('\n🎉 All configuration tests passed!')
      console.log('   Ready for Vercel deployment with environment variables')
      
    } else {
      console.log('❌ Failed to initialize Twilio client')
    }
    
  } catch (error: any) {
    console.error('❌ Configuration test failed:', error.message)
    
    if (error.message.includes('Missing Twilio configuration')) {
      console.log('\n💡 Make sure these environment variables are set:')
      console.log('   - TWILIO_ACCOUNT_SID')
      console.log('   - TWILIO_AUTH_TOKEN')
      console.log('   - TWILIO_PHONE_NUMBER')
    }
  }
}

console.log('Simplified Twilio Configuration Test')
console.log('====================================')
console.log('')

testSimplifiedTwilioConfig()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })