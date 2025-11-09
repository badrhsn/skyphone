import twilio from 'twilio'
import { PrismaClient } from '@prisma/client'

// Initialize Prisma client
const prisma = new PrismaClient()

// Cache for Twilio client
let twilioClientCache: any = null

// Simple Twilio client getter using environment variables
export const getTwilioClient = async () => {
  if (twilioClientCache) {
    return twilioClientCache
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error('Missing Twilio configuration in environment variables')
  }

  twilioClientCache = twilio(accountSid, authToken)
  return twilioClientCache
}

export const getClient = getTwilioClient

// Simple call initiation
export const initiateCall = async (to: string, from?: string) => {
  try {
    const twilioClient = await getTwilioClient()
    const fromNumber = from || process.env.TWILIO_PHONE_NUMBER
    
    if (!fromNumber) {
      throw new Error('No Twilio phone number configured')
    }

    const call = await twilioClient.calls.create({
      to,
      from: fromNumber,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice`,
    })

    console.log('✅ Call initiated successfully:', call.sid)
    return call
  } catch (error) {
    console.error('❌ Call initiation failed:', error)
    throw error
  }
}



export const getCallStatus = async (callSid: string) => {
  try {
    const twilioClient = await getTwilioClient()
    const call = await twilioClient.calls(callSid).fetch()
    return call
  } catch (error) {
    console.error('Error fetching call status:', error)
    throw error
  }
}

// Phone Number Management Functions
export const searchAvailableNumbers = async (countryCode: string, areaCode?: string) => {
  try {
    const twilioClient = await getTwilioClient()

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

    const availableNumbers = await twilioClient.availablePhoneNumbers(countryCode)
      .local
      .list(searchParams)

    return availableNumbers.map((number: any) => ({
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
    const twilioClient = await getTwilioClient()

    if (countryCode !== 'US' && countryCode !== 'CA') {
      throw new Error('Toll-free numbers currently only available for US and Canada')
    }

    const availableNumbers = await twilioClient.availablePhoneNumbers(countryCode)
      .tollFree
      .list({ limit: 20 })

    return availableNumbers.map((number: any) => ({
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
    const twilioClient = await getTwilioClient()

    const purchasedNumber = await twilioClient.incomingPhoneNumbers.create({
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
    const twilioClient = await getTwilioClient()
    await twilioClient.incomingPhoneNumbers(phoneNumberSid).remove()
    return { success: true }
  } catch (error) {
    console.error('Error releasing phone number:', error)
    throw error
  }
}

// SMS Functions for Caller ID Verification
export const sendSMS = async (to: string, message: string, from?: string) => {
  try {
    const twilioClient = await getTwilioClient()
    const fromNumber = from || process.env.TWILIO_PHONE_NUMBER
    
    if (!fromNumber) {
      throw new Error('No Twilio phone number configured')
    }
    
    const sms = await twilioClient.messages.create({
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
    const twilioClient = await getTwilioClient()
    const fromNumber = process.env.TWILIO_PHONE_NUMBER
    
    if (!fromNumber) {
      throw new Error('No Twilio phone number configured')
    }

    const call = await twilioClient.calls.create({
      to,
      from: fromNumber,
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
