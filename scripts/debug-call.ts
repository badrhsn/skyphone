import { PrismaClient } from '@prisma/client'
import { getTwilioClient } from '../src/lib/twilio'

const prisma = new PrismaClient()

async function debugCallInitiation() {
  console.log('🔍 Debugging Call Initiation Process...\n')

  const testNumber = '+212626110866' // Morocco number
  const fromNumber = '+12293983710'  // Your Twilio number

  try {
    // 1. Test country detection
    console.log('1. Testing country detection for', testNumber)
    
    function getCountryCodeFromPhoneNumber(phoneNumber: string): string | null {
      const cleaned = phoneNumber.replace(/\D/g, '');
      
      const phoneToCountryMap: { [key: string]: string } = {
        '1': 'US',
        '44': 'GB', 
        '33': 'FR',
        '49': 'DE',
        '34': 'ES',
        '39': 'IT',
        '91': 'IN',
        '86': 'CN',
        '81': 'JP',
        '82': 'KR',
        '212': 'MA', // Morocco
        '213': 'DZ',
        '216': 'TN',
        '218': 'LY',
        '20': 'EG',
        '966': 'SA',
        '971': 'AE',
        '972': 'IL',
        '90': 'TR',
        '52': 'MX',
        '55': 'BR',
        '54': 'AR',
        '56': 'CL',
        '57': 'CO',
        '51': 'PE',
        '27': 'ZA',
        '234': 'NG',
        '254': 'KE',
        '60': 'MY',
        '65': 'SG',
        '66': 'TH',
        '84': 'VN',
        '62': 'ID',
        '63': 'PH',
        '852': 'HK',
        '886': 'TW',
        '61': 'AU',
        '64': 'NZ',
      };
      
      // Try different prefix lengths (1-4 digits)
      for (let len = 4; len >= 1; len--) {
        const prefix = cleaned.substring(0, len);
        if (phoneToCountryMap[prefix]) {
          return phoneToCountryMap[prefix];
        }
      }
      
      return null;
    }

    const cleanNumber = testNumber.replace(/\D/g, "");
    const countryCode = getCountryCodeFromPhoneNumber(cleanNumber);
    
    console.log(`   Clean number: ${cleanNumber}`)
    console.log(`   Detected country: ${countryCode}`)
    
    if (!countryCode) {
      console.log('❌ Failed to detect country - this would cause call to fail')
      return
    }

    // 2. Check call rates
    console.log('\n2. Checking call rates for', countryCode)
    
    const rate = await prisma.callRate.findFirst({
      where: {
        countryCode: countryCode,
        isActive: true,
      },
    });

    if (!rate) {
      console.log('❌ No active call rate found for', countryCode)
      console.log('   This would cause "Calling to this country is not supported" error')
      
      // Check if any rates exist for this country
      const inactiveRates = await prisma.callRate.findMany({
        where: {
          countryCode: countryCode,
        },
      });
      
      if (inactiveRates.length > 0) {
        console.log('   Found inactive rates:', inactiveRates.map(r => `${r.country} - ${r.rate} (active: ${r.isActive})`))
      } else {
        console.log('   No rates found at all for this country')
      }
      return
    }

    console.log('✅ Found call rate:')
    console.log(`   Country: ${rate.country}`)
    console.log(`   Rate: $${rate.rate}/min`)
    console.log(`   Currency: ${rate.currency}`)
    console.log(`   Active: ${rate.isActive}`)

    // 3. Test Twilio client and call creation
    console.log('\n3. Testing Twilio call initiation...')
    
    const client = await getTwilioClient()
    if (!client) {
      console.log('❌ Failed to get Twilio client')
      return
    }

    try {
      // Test the actual call creation
      console.log(`   Attempting to create call from ${fromNumber} to ${testNumber}`)
      
      const call = await client.calls.create({
        to: testNumber,
        from: fromNumber,
        url: `http://localhost:3000/api/twilio/voice`,
      })
      
      console.log('✅ Call created successfully!')
      console.log(`   Call SID: ${call.sid}`)
      console.log(`   Status: ${call.status}`)
      console.log(`   Direction: ${call.direction}`)
      
      // Wait a moment and check call status
      setTimeout(async () => {
        try {
          const updatedCall = await client.calls(call.sid).fetch()
          console.log(`   Updated Status: ${updatedCall.status}`)
          if (updatedCall.status === 'failed') {
            console.log(`   Error Code: ${updatedCall.errorCode}`)
            console.log(`   Error Message: ${updatedCall.errorMessage}`)
          }
        } catch (error) {
          console.log('   Error fetching call status:', error)
        }
      }, 3000)

    } catch (twilioError: any) {
      console.log('❌ Twilio call creation failed:')
      console.log(`   Error: ${twilioError.message}`)
      
      if (twilioError.code) {
        console.log(`   Twilio Error Code: ${twilioError.code}`)
      }
      
      if (twilioError.status) {
        console.log(`   HTTP Status: ${twilioError.status}`)
      }
      
      if (twilioError.moreInfo) {
        console.log(`   More Info: ${twilioError.moreInfo}`)
      }

      // Common Twilio trial account issues
      if (twilioError.code === 21212) {
        console.log('\n💡 This is a trial account restriction.')
        console.log('   Trial accounts can only call verified phone numbers.')
        console.log('   Make sure +212626110866 is verified in your Twilio Console.')
      }
      
      if (twilioError.code === 21215) {
        console.log('\n💡 This number is not verified for trial accounts.')
        console.log('   You need to verify this number in your Twilio Console first.')
      }
    }

    // 4. Check if webhook endpoint exists
    console.log('\n4. Testing webhook endpoint...')
    
    try {
      const response = await fetch('http://localhost:3000/api/twilio/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'CallSid=test&From=%2B12293983710&To=%2B212626110866'
      })
      
      if (response.ok) {
        console.log('✅ Webhook endpoint is accessible')
        const text = await response.text()
        console.log(`   Response: ${text.substring(0, 100)}...`)
      } else {
        console.log(`⚠️  Webhook endpoint returned status: ${response.status}`)
      }
    } catch (webhookError) {
      console.log('❌ Webhook endpoint not accessible:', webhookError)
      console.log('   This could cause calls to fail')
    }

  } catch (error: any) {
    console.error('❌ Debug process failed:', error)
  }
}

console.log('Call Initiation Debugger')
console.log('========================')
console.log('')

debugCallInitiation()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })