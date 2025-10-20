import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle Vonage webhook events
    console.log('Vonage webhook received:', body)
    
    // Return NCCO (Nexmo Call Control Object) for call flow
    return NextResponse.json([
      {
        action: 'talk',
        text: 'Hello! This call is powered by YadaPhone with Vonage global routing.',
        voiceName: 'Amy',
        language: 'en-US'
      },
      {
        action: 'input',
        eventUrl: [`${process.env.NEXT_PUBLIC_APP_URL}/api/vonage/dtmf`],
        timeOut: 30,
        maxDigits: 1,
        submitOnHash: true
      }
    ])
    
  } catch (error) {
    console.error('Vonage webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle GET requests for webhook verification
export async function GET() {
  return NextResponse.json({ 
    message: 'Vonage voice webhook endpoint',
    provider: 'vonage',
    status: 'active'
  })
}