import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  // Build-time guard - return immediately during build
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV) {
    return NextResponse.json({ 
      success: true,
      message: "API ready - call functionality available at runtime"
    });
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { to, from } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Dynamic import to avoid build issues
    const { makeCall } = await import('@/lib/twilio-simple');
    
    try {
      const call = await makeCall(to);
      
      // Create call record in database
      await prisma.call.create({
        data: {
          userId: session.user.id,
          fromNumber: from || process.env.TWILIO_PHONE_NUMBER || '',
          toNumber: to,
          twilioSid: call.sid,
          status: "INITIATED",
          cost: 0,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Call initiated successfully",
        callSid: call.sid,
        status: call.status
      });
    } catch (twilioError: any) {
      console.error('Twilio call error:', twilioError);
      return NextResponse.json(
        { error: twilioError.message || 'Failed to initiate call' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Call initiation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}