import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // This endpoint handles Twilio webhooks for call status updates
    const formData = await request.formData();
    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;
    const callDuration = formData.get("CallDuration") as string;
    const to = formData.get("To") as string;
    const from = formData.get("From") as string;

    console.log("Twilio webhook received:", {
      callSid,
      callStatus,
      callDuration,
      to,
      from
    });

    // Find the call record in database
    const call = await prisma.call.findFirst({
      where: { twilioSid: callSid },
      include: { user: true }
    });

    if (call) {
      // Calculate cost based on duration and rate
      let cost = 0;
      if (callStatus === "completed" && callDuration) {
        const durationMinutes = Math.ceil(parseInt(callDuration) / 60);
        
        // Get the rate for this country
        const rate = await prisma.callRate.findFirst({
          where: { country: call.country, isActive: true }
        });
        
        if (rate) {
          cost = durationMinutes * rate.rate;
        }
      }

      // Update call record
      await prisma.call.update({
        where: { id: call.id },
        data: {
          status: callStatus.toUpperCase() as any,
          duration: callDuration ? parseInt(callDuration) : undefined,
          cost: cost,
          endedAt: callStatus === "completed" ? new Date() : undefined
        }
      });

      // Deduct cost from user balance if call completed
      if (callStatus === "completed" && cost > 0) {
        await prisma.user.update({
          where: { id: call.userId },
          data: {
            balance: {
              decrement: cost
            }
          }
        });

        console.log(`Deducted $${cost.toFixed(4)} from user ${call.userId} for call ${callSid}`);
      }
    }

    // Return TwiML to handle the call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello! Your call is being connected through Yadaphone.</Say>
  <Dial timeout="30" record="record-from-answer" recordingStatusCallback="${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/recording">
    ${to}
  </Dial>
</Response>`;

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    console.error("Twilio webhook error:", error);
    
    // Get form data again for error case
    const formData = await request.formData();
    const to = formData.get("To") as string;
    
    // Return basic TwiML even if there's an error
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Your call is being connected.</Say>
  <Dial timeout="30">${to || "unknown"}</Dial>
</Response>`;

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  }
}
