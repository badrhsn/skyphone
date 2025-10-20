import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is admin and return appropriate redirect URL
    const redirectUrl = session.user.isAdmin ? '/admin' : '/dashboard'
    
    return NextResponse.json({
      redirectUrl,
      isAdmin: session.user.isAdmin,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        isAdmin: session.user.isAdmin
      }
    })

  } catch (error) {
    console.error('Auth redirect error:', error)
    return NextResponse.json(
      { error: 'Internal server error', redirectUrl: '/dashboard' },
      { status: 500 }
    )
  }
}