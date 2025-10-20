import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID!
const authToken = process.env.TWILIO_AUTH_TOKEN!
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER!

export const client = twilio(accountSid, authToken)

export const initiateCall = async (to: string, from: string = twilioPhoneNumber) => {
  try {
    const call = await client.calls.create({
      to,
      from,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice`,
    })
    return call
  } catch (error) {
    console.error('Error initiating call:', error)
    throw error
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
