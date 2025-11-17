import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Call Status Webhook Handler
 * Receives call status updates from Twilio and stores them in database
 * Updates user balance and logs transactions
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;
    const callDuration = formData.get("CallDuration") as string;
    const to = formData.get("To") as string;
    const from = formData.get("From") as string;
    const parentCallSid = formData.get("ParentCallSid") as string;

    console.log("📞 [Call Status Webhook] Received:", {
      callSid,
      callStatus,
      duration: callDuration,
      to,
      from,
    });

    if (!callSid) {
      return NextResponse.json(
        { error: "Missing CallSid" },
        { status: 400 }
      );
    }

    // Find the call record
    let call = await prisma.call.findFirst({
      where: { twilioSid: callSid },
      include: { user: true },
    });

    if (!call) {
      console.warn(`⚠️  [Call Status Webhook] Call record not found for SID: ${callSid}`);
      // Try to create a new call record if it doesn't exist
      // This can happen for inbound calls
      if (to && from) {
        const user = await prisma.user.findFirst({
          where: { email: { not: "admin@yadaphone.com" } },
        });

        if (user) {
          call = await prisma.call.create({
            data: {
              userId: user.id,
              twilioSid: callSid,
              fromNumber: from,
              toNumber: to,
              country: "Unknown",
              status: callStatus.toUpperCase() as any,
              callerIdType: "public",
              cost: 0,
              duration: callDuration ? parseInt(callDuration) : 0,
              metadata: JSON.stringify({
                parentCallSid,
                webhookSource: true,
              }),
            },
            include: { user: true },
          });
          console.log(`✅ Created call record from webhook: ${call.id}`);
        }
      }
    }

    if (!call) {
      console.error(`❌ Could not find or create call for SID: ${callSid}`);
      return NextResponse.json(
        { error: "Call record not found" },
        { status: 404 }
      );
    }

    // Calculate cost if call is completed
    let cost = call.cost;
    if (callStatus === "completed" && callDuration) {
      const durationSeconds = parseInt(callDuration);
      const durationMinutes = Math.ceil(durationSeconds / 60);

      // Get the rate for this country
      const rate = await prisma.callRate.findFirst({
        where: {
          country: call.country,
          isActive: true,
        },
      });

      if (rate) {
        cost = durationMinutes * rate.rate;
      }

      console.log(
        `💰 Call cost calculated: ${durationMinutes} minutes × $${rate?.rate || 0} = $${cost.toFixed(4)}`
      );
    }

    // Update call record with status and duration
    const updatedCall = await prisma.call.update({
      where: { id: call.id },
      data: {
        status: callStatus.toUpperCase() as any,
        duration: callDuration ? parseInt(callDuration) : call.duration,
        cost: cost,
        endedAt: ["completed", "failed", "no-answer"].includes(callStatus)
          ? new Date()
          : undefined,
      },
      include: { user: true },
    });

    // Process balance deduction and transaction recording if call completed
    if (callStatus === "completed" && cost > 0) {
      // Deduct cost from user balance
      const updatedUser = await prisma.user.update({
        where: { id: call.userId },
        data: {
          balance: {
            decrement: cost,
          },
        },
      });

      console.log(
        `💳 Deducted $${cost.toFixed(4)} from user ${call.userId}. New balance: $${updatedUser.balance.toFixed(4)}`
      );

      // Check if contact exists and update last_called_at
      const existingContact = await prisma.contact.findFirst({
        where: {
          userId: call.userId,
          phoneNumber: call.toNumber,
        },
      });

      if (existingContact) {
        await prisma.contact.update({
          where: { id: existingContact.id },
          data: {
            updatedAt: new Date(),
          },
        });
        console.log(`👤 Updated contact last_called_at: ${existingContact.name}`);
      }
    }

    console.log(
      `✅ [Call Status Webhook] Processed call ${callSid}: ${callStatus}`
    );

    return NextResponse.json({
      success: true,
      callId: call.id,
      status: callStatus,
      cost: cost,
    });
  } catch (error) {
    console.error("❌ [Call Status Webhook] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log("✅ [Call Status Webhook] GET - Webhook is reachable");
  return NextResponse.json({
    status: "ok",
    message: "Call Status webhook is configured and reachable",
    timestamp: new Date().toISOString(),
  });
}
