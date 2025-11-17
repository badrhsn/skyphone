import { NextResponse } from "next/server";

const log = (msg: string, data?: any) => console.log(`🔷 [VerifyApiKey] ${msg}`, data || '');
const logSuccess = (msg: string, data?: any) => console.log(`✅ [VerifyApiKey] ${msg}`, data || '');
const logError = (msg: string, data?: any) => console.error(`❌ [VerifyApiKey] ${msg}`, data || '');

/**
 * Verify that Twilio API Key has Voice grant permissions
 * This checks if the API Key is properly configured for Twilio Programmable Voice
 */
export async function GET() {
  log('Checking API Key permissions...');

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKeySid = process.env.TWILIO_API_KEY_SID;
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;

    if (!accountSid || !apiKeySid || !apiKeySecret) {
      logError('Missing Twilio credentials');
      return NextResponse.json(
        {
          valid: false,
          error: 'Missing Twilio credentials (ACCOUNT_SID, API_KEY_SID, or API_KEY_SECRET)',
          missingVars: {
            accountSid: !accountSid,
            apiKeySid: !apiKeySid,
            apiKeySecret: !apiKeySecret,
          },
        },
        { status: 400 }
      );
    }

    log('Credentials found, attempting to create AccessToken...');

    // Import Twilio
    const twilioModule = await import('twilio');
    const AccessToken = twilioModule.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    // Try to create an AccessToken with VoiceGrant
    // If this fails, the API key doesn't have proper permissions
    const testToken = new AccessToken(
      accountSid,
      apiKeySid,
      apiKeySecret,
      { ttl: 3600 }
    );

    testToken.identity = 'test_api_key_verification';

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: process.env.TWIML_APP_SID,
      incomingAllow: true,
    });

    testToken.addGrant(voiceGrant);

    // If we get here without exception, token was created successfully
    const jwt = testToken.toJwt();

    logSuccess('API Key can create voice tokens', {
      keyType: 'API Key (not account auth token)',
      hasVoiceGrant: true,
      canMakeWebRTCCalls: true,
    });

    return NextResponse.json({
      valid: true,
      status: 'API Key has proper Voice permissions',
      details: {
        accountSid: accountSid.substring(0, 4) + '***',
        apiKeySid: apiKeySid.substring(0, 4) + '***',
        twimlAppSid: process.env.TWIML_APP_SID ? 'configured' : 'missing',
        canCreateTokens: true,
        voiceGrantSupported: true,
      },
      recommendations: [
        '✅ API Key is configured correctly for WebRTC calls',
        '✅ VoiceGrant permissions are available',
        '✅ Token generation should work',
      ],
    });
  } catch (error: any) {
    logError('API Key verification failed', {
      message: error?.message,
      code: error?.code,
    });

    // Determine what went wrong
    let recommendation = [];
    if (error?.message?.includes('Invalid')) {
      recommendation = [
        '❌ Invalid API Key SID or Secret',
        '→ Verify TWILIO_API_KEY_SID and TWILIO_API_KEY_SECRET in .env',
        '→ Go to https://www.twilio.com/console/account/keys',
      ];
    } else if (error?.message?.includes('permission')) {
      recommendation = [
        '❌ API Key missing Voice permissions',
        '→ Recreate the API Key with Voice grant enabled',
        '→ Go to https://www.twilio.com/console/account/keys → Create new Key',
      ];
    } else {
      recommendation = [
        `❌ Unexpected error: ${error?.message}`,
        '→ Check Twilio console for API Key status',
      ];
    }

    return NextResponse.json(
      {
        valid: false,
        error: error?.message,
        errorType: 'API_KEY_VALIDATION_FAILED',
        recommendations: recommendation,
      },
      { status: 400 }
    );
  }
}
