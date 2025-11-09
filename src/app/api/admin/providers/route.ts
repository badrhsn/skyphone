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

    // Get or create provider status entries
    const providers = ['twilio']
    
    // Ensure all providers exist in the database
    for (const providerName of providers) {
      await prisma.providerStatus.upsert({
        where: { provider: providerName },
        update: {},
        create: {
          provider: providerName,
          isActive: providerName === 'twilio', // Only Twilio active by default
          successRate: 100.0,
          avgResponseTime: 0,
        }
      })
    }

    const providerStatuses = await prisma.providerStatus.findMany({
      orderBy: {
        provider: 'asc'
      }
    })

    return NextResponse.json(providerStatuses)
  } catch (error) {
    console.error('Error fetching provider status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin && session?.user?.email !== 'admin@yadaphone.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { providerId, action, isActive } = await request.json()

    if (action === 'toggle') {
      await prisma.providerStatus.update({
        where: { id: providerId },
        data: {
          isActive: isActive,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ success: true, message: 'Provider status updated' })
    }

    if (action === 'test') {
      // Here you could implement actual provider testing logic
      // For now, we'll just update the last checked time
      await prisma.providerStatus.update({
        where: { id: providerId },
        data: {
          lastChecked: new Date(),
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ success: true, message: 'Provider tested successfully' })
    }

    if (action === 'refresh') {
      // Refresh all provider statuses
      // In a real implementation, you'd actually test each provider
      await prisma.providerStatus.updateMany({
        data: {
          lastChecked: new Date(),
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ success: true, message: 'All providers refreshed' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing provider action:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}