import twilio from 'twilio'
import Telnyx from 'telnyx'
import { Vonage } from '@vonage/server-sdk'

// Provider type definitions
interface Provider {
  name: string
  client: any
  phoneNumber: string
  priority: number
  regions: string[]
}

// Provider configurations
const providers = {
  twilio: {
    client: process.env.TWILIO_API_KEY 
      ? twilio(process.env.TWILIO_API_KEY, process.env.TWILIO_API_SECRET, {
          accountSid: process.env.TWILIO_ACCOUNT_SID
        })
      : twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!),
    phoneNumber: process.env.TWILIO_PHONE_NUMBER!,
    priority: 1,
    regions: ['US', 'CA', 'GB', 'AU'], // Primary regions for Twilio
  },
  telnyx: {
    client: process.env.TELNYX_API_KEY ? new Telnyx({ apiKey: process.env.TELNYX_API_KEY }) : null,
    phoneNumber: process.env.TELNYX_PHONE_NUMBER || '',
    priority: 2,
    regions: ['EU', 'AS', 'US'], // Primary regions for Telnyx
  },
  vonage: {
    client: (process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET) 
      ? new Vonage({
          apiKey: process.env.VONAGE_API_KEY,
          apiSecret: process.env.VONAGE_API_SECRET
        }) 
      : null,
    phoneNumber: process.env.VONAGE_PHONE_NUMBER || '',
    priority: 3,
    regions: ['GLOBAL'], // Fallback provider
  }
}

// Legacy export for backward compatibility
export const client = providers.twilio.client

// Enhanced call routing with provider failover
export const initiateCall = async (to: string, from?: string) => {
  const destinationCountry = getCountryFromNumber(to)
  const bestProvider = selectBestProvider(destinationCountry)
  
  try {
    const call = await attemptCallWithProvider(bestProvider, to, from)
    
    // Log successful call for analytics
    await logCallAttempt(to, bestProvider.name, 'SUCCESS', call.sid)
    
    return call
  } catch (error) {
    console.error(`Call failed with ${bestProvider.name}:`, error)
    
    // Try failover providers
    const failoverProviders = getFailoverProviders(bestProvider.name)
    
    for (const provider of failoverProviders) {
      try {
        console.log(`Attempting failover with ${provider.name}`)
        const call = await attemptCallWithProvider(provider, to, from)
        
        // Log successful failover
        await logCallAttempt(to, provider.name, 'FAILOVER_SUCCESS', call.sid)
        
        return call
      } catch (failoverError) {
        console.error(`Failover failed with ${provider.name}:`, failoverError)
        await logCallAttempt(to, provider.name, 'FAILOVER_FAILED')
      }
    }
    
    // All providers failed
    await logCallAttempt(to, 'ALL_PROVIDERS', 'FAILED')
    throw new Error('All providers failed to initiate call')
  }
}

// Helper function to attempt call with specific provider
const attemptCallWithProvider = async (provider: any, to: string, from?: string) => {
  const fromNumber = from || provider.phoneNumber
  
  if (provider.name === 'twilio') {
    return await provider.client.calls.create({
      to,
      from: fromNumber,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice`,
    })
  }
  
  if (provider.name === 'telnyx') {
    if (!provider.client) {
      throw new Error('Telnyx client not configured')
    }
    return await provider.client.calls.create({
      to,
      from: fromNumber,
      connection_id: process.env.TELNYX_CONNECTION_ID,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/telnyx/voice`,
    })
  }
  
  if (provider.name === 'vonage') {
    if (!provider.client) {
      throw new Error('Vonage client not configured')
    }
    return await provider.client.voice.createOutboundCall({
      to: [{ type: 'phone', number: to }],
      from: { type: 'phone', number: fromNumber },
      answer_url: [`${process.env.NEXT_PUBLIC_APP_URL}/api/vonage/voice`],
    })
  }
  
  throw new Error(`Provider ${provider.name} not implemented`)
}

// Select best provider based on destination and performance
const selectBestProvider = (countryCode: string) => {
  // Get available providers (only those with configured clients)
  const availableProviders = Object.entries(providers)
    .filter(([_, config]) => config.client !== null)
    .map(([name, config]) => ({ name, ...config }))
    .sort((a, b) => a.priority - b.priority)
  
  if (availableProviders.length === 0) {
    throw new Error('No providers configured')
  }
  
  // Regional optimization
  for (const provider of availableProviders) {
    if (provider.regions.includes(countryCode) || provider.regions.includes('GLOBAL')) {
      return {
        name: provider.name,
        client: provider.client,
        phoneNumber: provider.phoneNumber,
        priority: provider.priority
      }
    }
  }
  
  // Fallback to primary provider
  const primaryProvider = availableProviders[0]
  return {
    name: primaryProvider.name,
    client: primaryProvider.client,
    phoneNumber: primaryProvider.phoneNumber,
    priority: primaryProvider.priority
  }
}

// Get failover providers in priority order
const getFailoverProviders = (primaryProvider: string): Provider[] => {
  // Return other available providers as failover
  // For now, empty array since only Twilio is configured
  // In production, this would return configured backup providers:
  // return Object.values(providers)
  //   .filter(p => p.name !== primaryProvider)
  //   .sort((a, b) => a.priority - b.priority)
  
  return []
}

// Extract country code from phone number
const getCountryFromNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, '')
  
  // Common country code mappings
  if (cleaned.startsWith('1')) return 'US' // US/Canada
  if (cleaned.startsWith('44')) return 'GB' // UK
  if (cleaned.startsWith('49')) return 'DE' // Germany
  if (cleaned.startsWith('33')) return 'FR' // France
  if (cleaned.startsWith('81')) return 'JP' // Japan
  if (cleaned.startsWith('86')) return 'CN' // China
  if (cleaned.startsWith('91')) return 'IN' // India
  
  return 'UNKNOWN'
}

// Log call attempts for analytics
const logCallAttempt = async (
  to: string, 
  provider: string, 
  status: 'SUCCESS' | 'FAILOVER_SUCCESS' | 'FAILOVER_FAILED' | 'FAILED',
  callSid?: string,
  responseTime?: number,
  failureReason?: string
) => {
  try {
    console.log(`Call Analytics: ${to} via ${provider} - ${status}`, { callSid, responseTime })
    
    // TODO: Store in database for analytics once Prisma client is updated
    // This will be implemented after restarting the dev server
    
    /*
    const { prisma } = await import('@/lib/db')
    await prisma.callAnalytics.create({
      data: {
        phoneNumber: to,
        countryCode: getCountryFromNumber(to),
        provider,
        status,
        callSid,
        responseTime,
        failureReason,
      }
    })
    */
    
  } catch (error) {
    console.error('Failed to log call attempt:', error)
  }
}

export const getCallStatus = async (callSid: string) => {
  try {
    const call = await client.calls(callSid).fetch()
    return call
  } catch (error) {
    console.error('Error fetching call status:', error)
    throw error
  }
}

// Phone Number Management Functions
export const searchAvailableNumbers = async (countryCode: string, areaCode?: string) => {
  try {
    let searchParams: any = {
      limit: 20,
    }

    if (countryCode === 'US' || countryCode === 'CA') {
      searchParams.countryCode = countryCode
      if (areaCode) {
        searchParams.areaCode = areaCode
      }
    } else {
      throw new Error('Currently only US and Canada numbers are supported')
    }

    const availableNumbers = await client.availablePhoneNumbers(countryCode)
      .local
      .list(searchParams)

    return availableNumbers.map(number => ({
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      capabilities: {
        voice: number.capabilities.voice,
        sms: number.capabilities.sms,
        mms: number.capabilities.mms,
        fax: number.capabilities.fax
      },
      country: countryCode,
      locality: number.locality,
      region: number.region,
      postalCode: number.postalCode,
      isoCountry: number.isoCountry,
      addressRequirements: number.addressRequirements,
      beta: number.beta,
      monthlyPrice: getPhoneNumberPrice(countryCode, 'local'),
      setupFee: 2.00 // Increased from $1.00 to $2.00
    }))
  } catch (error) {
    console.error('Error searching available numbers:', error)
    throw error
  }
}

export const searchTollFreeNumbers = async (countryCode: string) => {
  try {
    if (countryCode !== 'US' && countryCode !== 'CA') {
      throw new Error('Toll-free numbers currently only available for US and Canada')
    }

    const availableNumbers = await client.availablePhoneNumbers(countryCode)
      .tollFree
      .list({ limit: 20 })

    return availableNumbers.map(number => ({
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      capabilities: {
        voice: number.capabilities.voice,
        sms: number.capabilities.sms,
        mms: number.capabilities.mms,
        fax: number.capabilities.fax
      },
      country: countryCode,
      locality: number.locality,
      region: number.region,
      postalCode: number.postalCode,
      isoCountry: number.isoCountry,
      addressRequirements: number.addressRequirements,
      beta: number.beta,
      monthlyPrice: getPhoneNumberPrice(countryCode, 'toll-free'),
      setupFee: 10.00 // Increased from $5.00 to $10.00 for premium toll-free
    }))
  } catch (error) {
    console.error('Error searching toll-free numbers:', error)
    throw error
  }
}

export const purchasePhoneNumber = async (phoneNumber: string, friendlyName?: string) => {
  try {
    const purchasedNumber = await client.incomingPhoneNumbers.create({
      phoneNumber,
      friendlyName: friendlyName || phoneNumber,
      voiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice`,
      smsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/sms`,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/status`,
      statusCallbackMethod: 'POST'
    })

    return {
      sid: purchasedNumber.sid,
      phoneNumber: purchasedNumber.phoneNumber,
      friendlyName: purchasedNumber.friendlyName,
      capabilities: purchasedNumber.capabilities,
      status: purchasedNumber.status,
      dateCreated: purchasedNumber.dateCreated
    }
  } catch (error) {
    console.error('Error purchasing phone number:', error)
    throw error
  }
}

export const releasePhoneNumber = async (phoneNumberSid: string) => {
  try {
    await client.incomingPhoneNumbers(phoneNumberSid).remove()
    return { success: true }
  } catch (error) {
    console.error('Error releasing phone number:', error)
    throw error
  }
}

// SMS Functions for Caller ID Verification
export const sendSMS = async (to: string, message: string, from?: string) => {
  try {
    const fromNumber = from || providers.twilio.phoneNumber
    
    const sms = await client.messages.create({
      to,
      from: fromNumber,
      body: message
    })

    return {
      sid: sms.sid,
      status: sms.status,
      to: sms.to,
      from: sms.from,
      body: sms.body,
      dateCreated: sms.dateCreated
    }
  } catch (error) {
    console.error('Error sending SMS:', error)
    throw error
  }
}

export const sendCallerIdVerificationSMS = async (to: string, verificationCode: string) => {
  const message = `Your YadaPhone caller ID verification code is: ${verificationCode}. This code expires in 15 minutes.`
  
  try {
    return await sendSMS(to, message)
  } catch (error) {
    console.error('Error sending verification SMS:', error)
    throw error
  }
}

// Voice Call Verification (alternative to SMS)
export const makeVerificationCall = async (to: string, verificationCode: string) => {
  try {
    const call = await client.calls.create({
      to,
      from: providers.twilio.phoneNumber,
      twiml: `
        <Response>
          <Say voice="alice" language="en-US">
            Hello! Your YadaPhone caller ID verification code is: 
            <say-as interpret-as="digits">${verificationCode}</say-as>
            I repeat, your verification code is: 
            <say-as interpret-as="digits">${verificationCode}</say-as>
            This code expires in 15 minutes. Thank you!
          </Say>
        </Response>
      `
    })

    return {
      sid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from,
      direction: call.direction,
      dateCreated: call.dateCreated
    }
  } catch (error) {
    console.error('Error making verification call:', error)
    throw error
  }
}

// Helper function to get pricing based on country and type
const getPhoneNumberPrice = (countryCode: string, type: 'local' | 'toll-free'): number => {
  const pricing: { [key: string]: { local: number; tollFree: number } } = {
    'US': { local: 2.00, tollFree: 4.00 },  // Increased from $1/$2 to $2/$4
    'CA': { local: 2.50, tollFree: 5.00 }   // Increased from $1.25/$2.50 to $2.50/$5
  }

  const countryPricing = pricing[countryCode]
  if (!countryPricing) {
    throw new Error(`Pricing not available for country: ${countryCode}`)
  }

  return type === 'local' ? countryPricing.local : countryPricing.tollFree
}
