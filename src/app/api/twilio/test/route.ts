import { NextRequest, NextResponse } from "next/server";
import { getTwilioClient } from "@/lib/twilio";

export async function GET() {
  try {
    // Test Twilio connection
    const client = await getTwilioClient();
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    
    return NextResponse.json({
      success: true,
      message: "Twilio connection successful",
      account: {
        sid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status,
        type: account.type
      },
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    });
  } catch (error) {
    console.error("Twilio test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}