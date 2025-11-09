import { NextResponse } from "next/server";

export async function GET() {
  // Only allow in development or with a secret key
  const debugKey = process.env.DEBUG_KEY;
  
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    googleClientIdPreview: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + "...",
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPreview: process.env.DATABASE_URL?.substring(0, 30) + "...",
    hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
    twilioSidPreview: process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + "...",
    timestamp: new Date().toISOString(),
  });
}
