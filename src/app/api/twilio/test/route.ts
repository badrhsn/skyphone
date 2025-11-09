import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // Don't initialize Twilio during build
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV) {
    return NextResponse.json({
      success: true,
      message: "Build environment - skipping Twilio test",
      build: true
    });
  }

  try {
    // Only import and test Twilio at runtime
    const { getTwilioClient } = await import('@/lib/twilio-simple');
    const client = await getTwilioClient();
    
    if (!client) {
      return NextResponse.json({
        success: false,
        error: "Twilio client not available in current environment"
      }, { status: 500 });
    }

    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch();
    
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