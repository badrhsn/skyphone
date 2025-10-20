import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle DTMF input from Vonage
    const { dtmf } = body
    
    console.log('Vonage DTMF received:', dtmf)
    
    // Return NCCO based on input
    if (dtmf === '1') {
      return NextResponse.json([
        {
          action: 'talk',
          text: 'Thank you for pressing 1. Your call is being processed.',
          voiceName: 'Amy'
        }
      ])
    }
    
    return NextResponse.json([
      {
        action: 'talk',
        text: 'Invalid input. Goodbye!',
        voiceName: 'Amy'
      }
    ])
    
  } catch (error) {
    console.error('Vonage DTMF error:', error)
    return NextResponse.json(
      { error: 'DTMF processing failed' },
      { status: 500 }
    )
  }
}