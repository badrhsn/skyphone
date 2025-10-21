import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const resolvedParams = await params;
    const callerIdId = resolvedParams.id;

    // Find the caller ID to ensure it belongs to the user
    const callerId = await (prisma as any).callerID.findFirst({
      where: {
        id: callerIdId,
        userId: user.id
      }
    });

    if (!callerId) {
      return NextResponse.json({ error: 'Caller ID not found' }, { status: 404 });
    }

    // Delete the caller ID
    await (prisma as any).callerID.delete({
      where: { id: callerIdId }
    });

    return NextResponse.json({ message: 'Caller ID deleted successfully' });
  } catch (error) {
    console.error('Error deleting caller ID:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}