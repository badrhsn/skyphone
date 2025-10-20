import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin && session?.user?.email !== 'admin@yadaphone.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        balance: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin && session?.user?.email !== 'admin@yadaphone.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { userId, action, amount } = await request.json()

    if (action === 'addCredits') {
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          balance: {
            increment: amount
          }
        }
      })

      return NextResponse.json({ success: true, message: 'Credits added successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin && session?.user?.email !== 'admin@yadaphone.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { userId } = await request.json()

    // Don't allow deleting admin users
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, email: true }
    })

    if (user?.isAdmin || user?.email === 'admin@yadaphone.com') {
      return NextResponse.json({ error: 'Cannot delete admin user' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
