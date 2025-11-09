// Ultra-simple Twilio client with strong build guards

let twilioClient: any = null

export const getTwilioClient = async () => {
  // STRONG build guard - return null during production build
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    return null
  }

  if (twilioClient) return twilioClient

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    console.warn('Twilio environment variables not configured')
    return null
  }

  try {
    const twilioModule = await import('twilio')
    const tw = (twilioModule && (twilioModule.default || twilioModule))
    twilioClient = tw(accountSid, authToken)
    return twilioClient
  } catch (error) {
    console.error('Failed to initialize Twilio:', error)
    return null
  }
}

export const makeCall = async (to: string) => {
  const client = await getTwilioClient()
  if (!client) {
    throw new Error('Twilio not available in current environment')
  }

  const fromNumber = process.env.TWILIO_PHONE_NUMBER
  if (!fromNumber) {
    throw new Error('Twilio phone number not configured')
  }

  return client.calls.create({
    to,
    from: fromNumber,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice`,
  })
}

export const getCallStatus = async (callSid: string) => {
  const client = await getTwilioClient()
  if (!client) throw new Error('Twilio not available in current environment')
  return client.calls(callSid).fetch()
}

export const sendSMS = async (to: string, message: string) => {
  const client = await getTwilioClient()
  if (!client) throw new Error('Twilio not available in current environment')

  const fromNumber = process.env.TWILIO_PHONE_NUMBER
  if (!fromNumber) throw new Error('Twilio phone number not configured')

  return client.messages.create({ to, from: fromNumber, body: message })
}

export default { getTwilioClient, makeCall, getCallStatus, sendSMS }
