import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle Telnyx webhook events
    const { data } = body
    
    if (!data) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }
    
    const { event_type, payload } = data
    
    switch (event_type) {
      case 'call.initiated':
        console.log('Telnyx call initiated:', payload.call_control_id)
        // Return NCCO (Nexmo Call Control Object) equivalent for Telnyx
        return NextResponse.json({
          commands: [
            {
              command: 'speak',
              payload: {
                text: 'Hello! This call is powered by YadaPhone with Telnyx routing.',
                voice: 'female',
                language: 'en-US'
              }
            }
          ]
        })
        
      case 'call.answered':
        console.log('Telnyx call answered:', payload.call_control_id)
        break
        
      case 'call.hangup':
        console.log('Telnyx call ended:', payload.call_control_id)
        break
        
      default:
        console.log('Unknown Telnyx event:', event_type)
    }
    
    return NextResponse.json({ status: 'received' })
    
  } catch (error) {
    console.error('Telnyx webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle GET requests for webhook verification
export async function GET() {
  return NextResponse.json({ 
    message: 'Telnyx voice webhook endpoint',
    provider: 'telnyx',
    status: 'active'
  })
}