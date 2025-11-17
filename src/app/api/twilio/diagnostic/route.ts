import { NextResponse } from "next/server";

/**
 * Diagnostic endpoint to verify Twilio WebRTC configuration
 * GET /api/twilio/diagnostic
 * 
 * Returns configuration status and checks if all required environment variables are set
 */
export async function GET() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const twimlAppSid = process.env.TWIML_APP_SID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  const config = {
    accountSid: {
      configured: !!accountSid,
      value: accountSid ? `${accountSid.substring(0, 4)}...${accountSid.substring(accountSid.length - 4)}` : "missing",
    },
    apiKeySid: {
      configured: !!apiKeySid,
      value: apiKeySid ? `${apiKeySid.substring(0, 4)}...${apiKeySid.substring(apiKeySid.length - 4)}` : "missing",
    },
    apiKeySecret: {
      configured: !!apiKeySecret,
      value: apiKeySecret ? "***" : "missing",
    },
    twimlAppSid: {
      configured: !!twimlAppSid,
      value: twimlAppSid || "missing",
      description: "Required for WebRTC outgoing calls to be routed to TwiML",
    },
    appUrl: {
      configured: !!appUrl,
      value: appUrl || "missing",
      description: "Base URL for webhook callbacks (must be HTTPS and reachable by Twilio)",
    },
    twilioPhoneNumber: {
      configured: !!twilioPhoneNumber,
      value: twilioPhoneNumber || "missing",
    },
    voiceWebhookUrl: {
      configured: !!appUrl,
      value: appUrl ? `${appUrl}/api/twilio/voice` : "missing",
      description: "This URL should be set in Twilio Console -> TwiML Apps -> Voice URL",
    },
  };

  // Check if all required fields are configured
  const allConfigured =
    config.accountSid.configured &&
    config.apiKeySid.configured &&
    config.apiKeySecret.configured &&
    config.twimlAppSid.configured &&
    config.appUrl.configured;

  const diagnosticInfo = {
    status: allConfigured ? "✅ OK - All required configuration is set" : "❌ ERROR - Missing configuration",
    configuration: config,
    nextSteps: [
      "1. Verify that the Voice URL in Twilio Console matches: " + (appUrl ? `${appUrl}/api/twilio/voice` : "missing"),
      "2. Test webhook reachability: GET " + (appUrl ? `${appUrl}/api/twilio/voice` : "missing"),
      "3. Make a test WebRTC call and check server logs for 🔔 [Twilio Voice Webhook] messages",
      "4. Monitor Twilio Console -> Programmable Voice -> Logs for any errors",
    ],
    timestamp: new Date().toISOString(),
  };

  console.log("🔍 [Diagnostic] WebRTC Configuration Status:", diagnosticInfo);

  return NextResponse.json(diagnosticInfo);
}
