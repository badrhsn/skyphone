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

    const payments = await prisma.payment.findMany({
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
      take: 100 // Limit to recent 100 payments
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin && session?.user?.email !== 'admin@yadaphone.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { paymentId, action } = await request.json()

    if (action === 'refund') {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { user: true }
      })

      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      if (payment.status !== 'COMPLETED') {
        return NextResponse.json({ error: 'Can only refund completed payments' }, { status: 400 })
      }

      // Subtract the refunded amount from user balance
      await prisma.user.update({
        where: { id: payment.userId },
        data: {
          balance: {
            decrement: payment.amount
          }
        }
      })

      // Update payment status to cancelled (refunded)
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'CANCELLED'
        }
      })

      return NextResponse.json({ success: true, message: 'Payment refunded successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing payment action:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}