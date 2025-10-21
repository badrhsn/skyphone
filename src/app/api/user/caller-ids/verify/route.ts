import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
// CallerIDStatus enum will be available after generation

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { callerIdId, verificationCode } = await request.json();

    if (!callerIdId || !verificationCode) {
      return NextResponse.json({ error: 'Caller ID and verification code are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the caller ID
    const callerId = await (prisma as any).callerID.findFirst({
      where: {
        id: callerIdId,
        userId: user.id
      }
    });

    if (!callerId) {
      return NextResponse.json({ error: 'Caller ID not found' }, { status: 404 });
    }

    // Check if already verified
    if (callerId.status === 'VERIFIED') {
      return NextResponse.json({ error: 'Caller ID is already verified' }, { status: 400 });
    }

    // Check if code has expired
    if (callerId.verificationCodeExpiry && new Date() > callerId.verificationCodeExpiry) {
      await (prisma as any).callerID.update({
        where: { id: callerIdId },
        data: { 
          status: 'EXPIRED',
          verificationAttempts: { increment: 1 }
        }
      });
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    // Check verification attempts
    if (callerId.verificationAttempts >= 3) {
      await (prisma as any).callerID.update({
        where: { id: callerIdId },
        data: { status: 'FAILED' }
      });
      return NextResponse.json({ error: 'Too many verification attempts. Please add the caller ID again.' }, { status: 400 });
    }

    // Verify the code
    if (callerId.verificationCode !== verificationCode) {
      await (prisma as any).callerID.update({
        where: { id: callerIdId },
        data: { verificationAttempts: { increment: 1 } }
      });
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Verification successful
    const updatedCallerId = await (prisma as any).callerID.update({
      where: { id: callerIdId },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verificationCode: null,
        verificationCodeExpiry: null,
        isActive: true
      }
    });

    return NextResponse.json({
      callerId: {
        id: updatedCallerId.id,
        phoneNumber: updatedCallerId.phoneNumber,
        status: updatedCallerId.status,
        verifiedAt: updatedCallerId.verifiedAt,
        isActive: updatedCallerId.isActive
      },
      message: 'Caller ID verified successfully'
    });
  } catch (error) {
    console.error('Error verifying caller ID:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}