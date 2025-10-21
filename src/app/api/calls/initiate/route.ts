import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initiateCall } from "@/lib/twilio";
import { checkBalanceBeforeCall } from "@/lib/auto-topup";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { to, from, callerIdType, callerIdInfo } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Validate verified caller ID if specified
    if (callerIdType === "verified" && callerIdInfo?.verifiedId) {
      const verifiedCallerId = await (prisma as any).callerID.findFirst({
        where: {
          userId: session.user.id,
          phoneNumber: callerIdInfo.verifiedId,
          status: 'VERIFIED'
        }
      });

      if (!verifiedCallerId) {
        return NextResponse.json(
          { error: "Caller ID not verified or not found" },
          { status: 400 }
        );
      }
    }

    // Check balance and trigger auto top-up if needed
    const balanceCheck = await checkBalanceBeforeCall(session.user.id, 1.0);
    
    if (!balanceCheck.canProceed) {
      return NextResponse.json(
        { 
          error: "Insufficient balance. Please add credits or enable auto top-up.",
          autoTopupSuggested: true
        },
        { status: 400 }
      );
    }

    // Detect country and get rate
    const cleanNumber = to.replace(/\D/g, "");
    const rate = await prisma.callRate.findFirst({
      where: {
        countryCode: {
          startsWith: "+" + cleanNumber.substring(0, 3),
        },
        isActive: true,
      },
    });

    if (!rate) {
      return NextResponse.json(
        { error: "Calling to this country is not supported" },
        { status: 400 }
      );
    }

    // Create call record
    const call = await prisma.call.create({
      data: {
        userId: session.user.id,
        fromNumber: from || "+1234567890",
        toNumber: to,
        country: rate.country,
        status: "INITIATED",
        cost: 0, // Will be updated when call ends
        callerIdType: callerIdType || 'public',
        // Add caller ID metadata for analytics
        metadata: callerIdType ? JSON.stringify({ 
          callerIdType, 
          isVerifiedCallerId: callerIdType === 'verified' 
        }) : null,
      },
    });

    try {
      // Initiate call with Twilio
      const twilioCall = await initiateCall(to, from);
      
      // Update call with Twilio SID
      await prisma.call.update({
        where: { id: call.id },
        data: { twilioSid: twilioCall.sid },
      });

      return NextResponse.json({
        message: "Call initiated successfully",
        callId: call.id,
        twilioSid: twilioCall.sid,
      });
    } catch (twilioError) {
      // Update call status to failed
      await prisma.call.update({
        where: { id: call.id },
        data: { status: "FAILED" },
      });

      console.error("Twilio call initiation error:", twilioError);
      return NextResponse.json(
        { error: "Failed to initiate call. Please try again." },
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
