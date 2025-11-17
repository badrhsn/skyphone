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

    console.log("🔔 [Twilio Voice Webhook] Incoming request:", {
      callSid,
      callStatus,
      callDuration,
      to,
      from
    });

    // Validate required fields for Dial
    if (!to) {
      console.error('❌ [Twilio Voice Webhook] Missing "To" parameter - call cannot be routed');
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Error: Invalid call parameters. No destination provided.</Say>
</Response>`;
      return new NextResponse(errorTwiml, {
        status: 400,
        headers: { "Content-Type": "text/xml" },
      });
    }

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
    console.log(`✅ [Twilio Voice Webhook] Generating TwiML to dial: ${to}`);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello! Your call is being connected through Yadaphone.</Say>
  <Dial timeout="30" record="record-from-answer" recordingStatusCallback="${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/recording">
    ${to}
  </Dial>
</Response>`;

    console.log(`📤 [Twilio Voice Webhook] Returning TwiML (length: ${twiml.length} bytes)`);
    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    console.error("❌ [Twilio Voice Webhook] Error handling request:", error);
    
    // Get form data again for error case
    const formData = await request.formData();
    const to = formData.get("To") as string;
    
    if (!to) {
      console.error("❌ [Twilio Voice Webhook] No destination in error recovery");
      const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Service error. Please try again later.</Say>
</Response>`;
      return new NextResponse(fallbackTwiml, {
        status: 500,
        headers: { "Content-Type": "text/xml" },
      });
    }
    
    // Return basic TwiML even if there's an error
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Your call is being connected.</Say>
  <Dial timeout="30">${to || "unknown"}</Dial>
</Response>`;

    console.log(`📤 [Twilio Voice Webhook] Error recovery TwiML sent for: ${to}`);
    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  }
}

// GET endpoint for diagnostic purposes - verify the webhook is reachable
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const twimlAppSid = process.env.TWIML_APP_SID;
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;

  console.log("🔍 [Twilio Voice Webhook] GET Diagnostic Check");
  console.log({
    webhookUrl: `${appUrl}/api/twilio/voice`,
    twimlAppSid,
    twilioAccountSid: twilioAccountSid ? `${twilioAccountSid.substring(0, 4)}...` : 'missing',
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({
    status: "ok",
    message: "Twilio Voice webhook is reachable",
    webhookUrl: `${appUrl}/api/twilio/voice`,
    twimlAppSid,
    configured: {
      appUrl: !!appUrl,
      twimlAppSid: !!twimlAppSid,
      accountSid: !!twilioAccountSid,
    },
    timestamp: new Date().toISOString(),
  });
}
