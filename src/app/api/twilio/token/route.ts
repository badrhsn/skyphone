import { NextResponse } from "next/server";

const DEBUG = true;
const log = (msg: string, data?: any) => {
  if (DEBUG) console.log(`🔷 [Token] ${msg}`, data || '');
};
const logError = (msg: string, data?: any) => {
  console.error(`❌ [Token] ${msg}`, data || '');
};
const logSuccess = (msg: string, data?: any) => {
  console.log(`✅ [Token] ${msg}`, data || '');
};

// Issue a Twilio Access Token (VoiceGrant) for browser WebRTC (Twilio Client)
export async function GET() {
  log('Token endpoint called');
  
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKeySid = process.env.TWILIO_API_KEY_SID;
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
    const twimlAppSid = process.env.TWIML_APP_SID;

    // Validate all required env vars
    if (!accountSid) {
      logError('Missing TWILIO_ACCOUNT_SID');
      return NextResponse.json(
        { error: 'TWILIO_ACCOUNT_SID not configured' },
        { status: 500 }
      );
    }
    if (!apiKeySid) {
      logError('Missing TWILIO_API_KEY_SID');
      return NextResponse.json(
        { error: 'TWILIO_API_KEY_SID not configured' },
        { status: 500 }
      );
    }
    if (!apiKeySecret) {
      logError('Missing TWILIO_API_KEY_SECRET');
      return NextResponse.json(
        { error: 'TWILIO_API_KEY_SECRET not configured' },
        { status: 500 }
      );
    }
    if (!twimlAppSid) {
      logError('Missing TWIML_APP_SID');
      return NextResponse.json(
        { error: 'TWIML_APP_SID not configured' },
        { status: 500 }
      );
    }

    log('All env vars found', { 
      accountSid: accountSid.substring(0, 4) + '***',
      apiKeySid: apiKeySid.substring(0, 4) + '***',
      twimlAppSid: twimlAppSid.substring(0, 4) + '***'
    });

    // dynamic import to avoid build-time issues
    log('Importing Twilio module...');
    const twilioModule = await import('twilio');
    const AccessToken = twilioModule.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;
    log('Twilio module imported successfully');

    // Identity can be improved to use session user id/email
    const identity = `user_${Date.now()}`;
    log('Generated identity', { identity });

    // Create token with 1 hour TTL
    const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, { 
      ttl: 3600,
      identity: identity
    });
    log('AccessToken created');

    // Add VoiceGrant with outgoing and incoming capabilities
    const grant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    });
    token.addGrant(grant);
    log('VoiceGrant added with', { 
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true 
    });

    // Convert to JWT
    const jwt = token.toJwt();
    logSuccess('Token generated', { 
      jwtLength: jwt.length,
      identity,
      ttl: '3600s'
    });

    return NextResponse.json({ token: jwt, identity });
  } catch (error: any) {
    logError('Token generation failed', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    return NextResponse.json(
      { 
        error: error?.message || 'Token generation failed',
        code: error?.code,
      },
      { status: 500 }
    );
  }
}
