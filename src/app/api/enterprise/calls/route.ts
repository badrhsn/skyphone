import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initiateCall } from "@/lib/twilio";

// Validate API key for external integrations
async function validateApiKey(apiKey: string) {
  // In production, store API keys in database with scopes and rate limits
  // For now, use a simple validation
  return apiKey === process.env.ENTERPRISE_API_KEY;
}

// Enterprise Call Initiation API
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (!apiKey || !await validateApiKey(apiKey)) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const { 
      to, 
      from, 
      userId, 
      metadata = {},
      webhook_url,
      record_call = false 
    } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: "Phone number 'to' is required" },
        { status: 400 }
      );
    }

    // Validate user exists and has sufficient balance
    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, balance: true, email: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (user.balance < 1) {
        return NextResponse.json(
          { error: "Insufficient balance" },
          { status: 400 }
        );
      }
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

    // Create call record with enterprise metadata
    const call = await prisma.call.create({
      data: {
        userId: userId || 'api-user', // Handle API-only calls
        fromNumber: from || "+1234567890",
        toNumber: to,
        country: rate.country,
        status: "INITIATED",
        cost: 0,
        // Add enterprise fields when schema supports it
        // metadata: JSON.stringify(metadata),
        // webhookUrl: webhook_url,
        // recordCall: record_call,
      },
    });

    try {
      // Initiate call with enhanced routing
      const twilioCall = await initiateCall(to, from);

      // Update call record
      await prisma.call.update({
        where: { id: call.id },
        data: { 
          twilioSid: twilioCall.sid,
          status: "RINGING",
        },
      });

      // Return enterprise API response
      return NextResponse.json({
        call_id: call.id,
        twilio_sid: twilioCall.sid,
        status: "initiated",
        estimated_cost_per_minute: rate.rate,
        country: rate.country,
        created_at: call.createdAt,
        metadata: metadata,
        webhook_url: webhook_url,
        recording_enabled: record_call,
      });

    } catch (twilioError) {
      // Update call status to failed
      await prisma.call.update({
        where: { id: call.id },
        data: { status: "FAILED" },
      });

      console.error("Enterprise API call initiation error:", twilioError);
      return NextResponse.json(
        { 
          error: "Failed to initiate call",
          call_id: call.id,
          details: process.env.NODE_ENV === 'development' ? twilioError : undefined
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Enterprise API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get call status - Enterprise API
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (!apiKey || !await validateApiKey(apiKey)) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const url = new URL(request.url);
    const callId = url.searchParams.get('call_id');
    const twilioSid = url.searchParams.get('twilio_sid');

    if (!callId && !twilioSid) {
      return NextResponse.json(
        { error: "Either call_id or twilio_sid is required" },
        { status: 400 }
      );
    }

    // Find call by ID or Twilio SID
    const call = await prisma.call.findFirst({
      where: callId 
        ? { id: callId }
        : { twilioSid: twilioSid },
      include: {
        user: {
          select: { id: true, email: true }
        }
      }
    });

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    return NextResponse.json({
      call_id: call.id,
      twilio_sid: call.twilioSid,
      status: call.status.toLowerCase(),
      from_number: call.fromNumber,
      to_number: call.toNumber,
      country: call.country,
      duration: call.duration,
      cost: call.cost,
      created_at: call.createdAt,
      ended_at: call.endedAt,
      user: call.user ? {
        id: call.user.id,
        email: call.user.email
      } : null,
    });

  } catch (error) {
    console.error("Enterprise API get call error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}