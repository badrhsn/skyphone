import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { callSid: string; filename: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { callSid, filename } = params

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

    // In production, this would:
    // 1. Check if recording exists in storage (S3, etc.)
    // 2. Stream the actual audio file
    // 3. Apply proper access controls and expiration

    // For now, return a mock response indicating the recording endpoint
    if (filename === 'recording.mp3') {
      return NextResponse.json({
        message: 'Recording endpoint',
        callSid,
        filename,
        status: 'available',
        downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/recordings/${callSid}/${filename}`,
        note: 'In production, this would stream the actual audio file'
      })
    }

    return NextResponse.json({ error: 'File not found' }, { status: 404 })

  } catch (error) {
    console.error('Recording file error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}