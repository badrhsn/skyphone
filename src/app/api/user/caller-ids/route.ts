import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
// CallerIDStatus enum will be available after successful generation

export async function GET() {
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

    // Get caller IDs separately for now
    const callerIds = await (prisma as any).callerID.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ callerIds });
  } catch (error) {
    console.error('Error fetching caller IDs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phoneNumber } = await request.json();

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Basic phone number validation
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    if (cleanPhoneNumber.length < 10) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    const formattedPhoneNumber = cleanPhoneNumber.startsWith('1') ? 
      `+${cleanPhoneNumber}` : `+1${cleanPhoneNumber}`;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if caller ID already exists for this user
    const existingCallerId = await (prisma as any).callerID.findFirst({
      where: {
        userId: user.id,
        phoneNumber: formattedPhoneNumber
      }
    });

    if (existingCallerId) {
      return NextResponse.json({ error: 'This phone number is already added' }, { status: 400 });
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create caller ID record
    const callerId = await (prisma as any).callerID.create({
      data: {
        userId: user.id,
        phoneNumber: formattedPhoneNumber,
        status: 'PENDING' as any,
        verificationCode,
        verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      }
    });

    // Send verification code via SMS (preferred) or voice call as fallback
    try {
      const { sendCallerIdVerificationSMS, makeVerificationCall } = await import('@/lib/twilio');
      
      try {
        // Try SMS first
        await sendCallerIdVerificationSMS(formattedPhoneNumber, verificationCode);
        console.log(`SMS verification sent to ${formattedPhoneNumber}`);
      } catch (smsError) {
        console.log(`SMS failed, trying voice call:`, smsError);
        // Fallback to voice call if SMS fails
        await makeVerificationCall(formattedPhoneNumber, verificationCode);
        console.log(`Voice verification call made to ${formattedPhoneNumber}`);
      }
    } catch (verificationError) {
      console.error(`Verification delivery failed:`, verificationError);
      // Still continue - user can request resend later
    }

    return NextResponse.json({ 
      callerId: {
        id: callerId.id,
        phoneNumber: callerId.phoneNumber,
        status: callerId.status,
        createdAt: callerId.createdAt
      },
      message: 'Caller ID added. Verification code sent.' 
    });
  } catch (error) {
    console.error('Error adding caller ID:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}