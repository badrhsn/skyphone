import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initiateCall } from "@/lib/twilio";

export async function POST(request: NextRequest) {
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

    // Get user's current balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has sufficient balance (minimum $1)
    if (user.balance < 1) {
      return NextResponse.json(
        { error: "Insufficient balance. Please add credits." },
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
