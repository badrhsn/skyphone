import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * Call Events Endpoint
 * Frontend can subscribe to this for real-time call status updates
 * Returns recent call events for the authenticated user
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const limit = request.nextUrl.searchParams.get("limit") || "50";
    const status = request.nextUrl.searchParams.get("status");

    // Get recent calls for the user
    const calls = await prisma.call.findMany({
      where: {
        userId,
        ...(status && { status: status.toUpperCase() as any }),
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            email: true,
            balance: true,
          },
        },
      },
    });

    // Transform calls to events format
    const events = calls.map((call) => ({
      id: call.id,
      callSid: call.twilioSid,
      fromNumber: call.fromNumber,
      toNumber: call.toNumber,
      country: call.country,
      status: call.status,
      duration: call.duration,
      cost: call.cost,
      startTime: call.createdAt,
      endTime: call.endedAt,
      userBalance: call.user?.balance || 0,
      recordingUrl: call.recordingUrl,
      recordingSid: call.recordingSid,
    }));

    return NextResponse.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("❌ [Call Events] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for creating call events manually
 * Useful for testing or manual event triggering
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      callSid,
      status,
      duration,
      cost,
      toNumber,
      fromNumber,
      country,
    } = body;

    if (!callSid || !status) {
      return NextResponse.json(
        { error: "Missing required fields: callSid, status" },
        { status: 400 }
      );
    }

    // Find or create call record
    let call = await prisma.call.findFirst({
      where: { twilioSid: callSid },
    });

    if (!call) {
      call = await prisma.call.create({
        data: {
          userId: session.user.id,
          twilioSid: callSid,
          fromNumber: fromNumber || "+1000000000",
          toNumber: toNumber || "+1000000000",
          country: country || "Unknown",
          status: status.toUpperCase() as any,
          callerIdType: "public",
          cost: cost || 0,
          duration: duration || 0,
        },
      });
    } else {
      // Update existing call
      call = await prisma.call.update({
        where: { id: call.id },
        data: {
          status: status.toUpperCase() as any,
          duration: duration || call.duration,
          cost: cost || call.cost,
          endedAt:
            ["completed", "failed", "no-answer"].includes(status) &&
            !call.endedAt
              ? new Date()
              : call.endedAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      event: {
        id: call.id,
        callSid: call.twilioSid,
        status: call.status,
        duration: call.duration,
        cost: call.cost,
      },
    });
  } catch (error) {
    console.error("❌ [Call Events POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
