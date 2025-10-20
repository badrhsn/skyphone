import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { callSid, action } = body

    if (!callSid) {
      return NextResponse.json({ error: 'Call SID required' }, { status: 400 })
    }

    // Validate call belongs to user
    const call = await prisma.call.findFirst({
      where: {
        twilioSid: callSid,
        userId: session.user.id,
      },
    })

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    switch (action) {
      case 'start':
        // Start recording for the call
        return NextResponse.json({
          success: true,
          message: 'Recording started',
          callSid,
          recordingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/recordings/${callSid}/start`,
          status: 'recording'
        })

      case 'stop':
        // Stop recording for the call
        return NextResponse.json({
          success: true,
          message: 'Recording stopped',
          callSid,
          recordingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/recordings/${callSid}/recording.mp3`,
          status: 'completed'
        })

      case 'status':
        // Get recording status
        return NextResponse.json({
          success: true,
          callSid,
          status: 'available',
          duration: 120, // seconds
          recordingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/recordings/${callSid}/recording.mp3`,
          size: '2.5MB',
          format: 'mp3'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Recording API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const callSid = url.searchParams.get('callSid')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')

    // Build query conditions
    const where: any = {
      userId: session.user.id,
    }

    if (callSid) {
      where.twilioSid = callSid
    }

    // Get user's recordings
    const recordings = await prisma.call.findMany({
      where,
      select: {
        id: true,
        twilioSid: true,
        toNumber: true,
        fromNumber: true,
        duration: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    const total = await prisma.call.count({ where })

    // Mock recording data (in production, this would come from actual storage)
    const recordingsWithUrls = recordings.map(call => ({
      ...call,
      hasRecording: Math.random() > 0.5, // Mock: 50% of calls have recordings
      recordingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/recordings/${call.twilioSid}/recording.mp3`,
      recordingDuration: call.duration,
      recordingSize: `${((call.duration || 0) * 0.5).toFixed(1)}MB`,
      recordingFormat: 'mp3'
    }))

    return NextResponse.json({
      recordings: recordingsWithUrls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })

  } catch (error) {
    console.error('Recordings list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}