import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get("CallSid") as string;
    const recordingSid = formData.get("RecordingSid") as string;
    const recordingUrl = formData.get("RecordingUrl") as string;
    const recordingDuration = formData.get("RecordingDuration") as string;

    console.log("Recording webhook received:", {
      callSid,
      recordingSid,
      recordingUrl,
      recordingDuration
    });

    // Find the call record and update with recording info
    const call = await prisma.call.findFirst({
      where: { twilioSid: callSid }
    });

    if (call) {
      await prisma.call.update({
        where: { id: call.id },
        data: {
          recordingUrl: recordingUrl,
          recordingSid: recordingSid
        }
      });

      console.log(`Updated call ${call.id} with recording ${recordingSid}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Recording webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}