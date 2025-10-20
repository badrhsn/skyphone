import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin && session?.user?.email !== 'admin@yadaphone.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const calls = await prisma.call.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit to recent 100 calls
    })

    return NextResponse.json(calls)
  } catch (error) {
    console.error('Error fetching calls:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin && session?.user?.email !== 'admin@yadaphone.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { callId, action } = await request.json()

    if (action === 'refund') {
      // Refund logic: add the call cost back to user's balance
      const call = await prisma.call.findUnique({
        where: { id: callId },
        include: { user: true }
      })

      if (!call) {
        return NextResponse.json({ error: 'Call not found' }, { status: 404 })
      }

      if (call.status !== 'COMPLETED') {
        return NextResponse.json({ error: 'Can only refund completed calls' }, { status: 400 })
      }

      // Add refund to user balance
      await prisma.user.update({
        where: { id: call.userId },
        data: {
          balance: {
            increment: call.cost
          }
        }
      })

      // Update call status
      await prisma.call.update({
        where: { id: callId },
        data: {
          status: 'CANCELLED' // Use CANCELLED to indicate refunded
        }
      })

      return NextResponse.json({ success: true, message: 'Call refunded successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing call action:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}