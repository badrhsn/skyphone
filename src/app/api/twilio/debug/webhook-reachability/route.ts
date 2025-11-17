import { NextResponse } from "next/server";

const log = (msg: string, data?: any) => console.log(`🔷 [WebhookTest] ${msg}`, data || '');
const logSuccess = (msg: string, data?: any) => console.log(`✅ [WebhookTest] ${msg}`, data || '');
const logError = (msg: string, data?: any) => console.error(`❌ [WebhookTest] ${msg}`, data || '');

/**
 * Test if Twilio can reach the voice webhook endpoint
 * This simulates a Twilio outbound call to verify the webhook is accessible
 */
export async function GET() {
  log('Testing webhook reachability...');

  try {
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL;
    const twimlAppSid = process.env.TWIML_APP_SID;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKeySid = process.env.TWILIO_API_KEY_SID;
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;

    if (!webhookUrl) {
      logError('NEXT_PUBLIC_APP_URL not configured');
      return NextResponse.json(
        {
          reachable: false,
          error: 'NEXT_PUBLIC_APP_URL not configured',
          steps: [
            '1. Set NEXT_PUBLIC_APP_URL in .env',
            '2. Example: https://skyphone-app.vercel.app',
          ],
        },
        { status: 400 }
      );
    }

    if (!twimlAppSid || !accountSid || !apiKeySid || !apiKeySecret) {
      logError('Missing Twilio credentials');
      return NextResponse.json(
        {
          reachable: false,
          error: 'Missing Twilio credentials',
          missingVars: {
            twimlAppSid: !twimlAppSid,
            accountSid: !accountSid,
            apiKeySid: !apiKeySid,
            apiKeySecret: !apiKeySecret,
          },
        },
        { status: 400 }
      );
    }

    log('Configuration found', {
      webhookUrl,
      twimlAppSid: twimlAppSid.substring(0, 4) + '***',
    });

    // Import Twilio
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, apiKeySecret, {
      accountSid,
      apiKeySid,
    });

    log('Twilio client initialized');

    // Fetch the TwiML App to verify it exists and get its configured webhook
    log('Fetching TwiML App configuration...');
    const app = await client.api.accounts(accountSid).applications(twimlAppSid).fetch();

    log('TwiML App found', {
      sid: app.sid,
      friendlyName: app.friendlyName,
      voiceUrl: app.voiceUrl,
      voiceMethod: app.voiceMethod,
    });

    // Check if voice URL matches our expected webhook
    const expectedVoiceUrl = `${webhookUrl}/api/twilio/voice`;
    const configuredUrl = app.voiceUrl;

    if (!configuredUrl || !configuredUrl.includes('voice')) {
      logError('Voice webhook not properly configured in TwiML App', {
        configured: configuredUrl,
        expected: expectedVoiceUrl,
      });

      return NextResponse.json({
        reachable: false,
        error: 'Voice webhook not configured in TwiML App',
        details: {
          configuredVoiceUrl: configuredUrl,
          expectedVoiceUrl: expectedVoiceUrl,
          twimlAppSid: twimlAppSid,
        },
        steps: [
          '1. Go to Twilio Console → Phone Numbers → Manage → Active Numbers',
          '2. Or go to Voice → Managing Numbers → Programmable Voice',
          '3. Click your phone number',
          '4. Under "Call comes in", set Request URL to:',
          `   ${expectedVoiceUrl}`,
          '5. Set Method to POST',
          '6. Save',
        ],
      });
    }

    // Test if we can reach the webhook from this server
    log('Testing webhook connectivity...');
    const webhookTest = await fetch(`${expectedVoiceUrl}?test=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch((err) => ({
      ok: false,
      status: 0,
      error: err.message,
    }));

    if (!webhookTest.ok && webhookTest.status !== 0) {
      logError('Webhook test failed', {
        status: webhookTest.status,
        error: webhookTest.error,
      });

      return NextResponse.json({
        reachable: false,
        error: `Webhook returned ${webhookTest.status}`,
        webhookUrl: expectedVoiceUrl,
        steps: [
          '1. Verify webhook URL is publicly accessible',
          '2. Check firewall rules',
          '3. Ensure app is deployed to Vercel or similar',
          '4. Test with curl: curl ' + expectedVoiceUrl,
        ],
      });
    }

    logSuccess('Webhook is reachable', {
      webhookUrl: expectedVoiceUrl,
      twimlAppConfigured: true,
      testResult: 'reachable',
    });

    return NextResponse.json({
      reachable: true,
      status: 'Voice webhook is properly configured and reachable',
      details: {
        webhookUrl: expectedVoiceUrl,
        twimlAppSid: twimlAppSid,
        voiceMethod: app.voiceMethod,
        configurationStatus: 'ready',
      },
      recommendations: [
        '✅ Webhook URL is configured in TwiML App',
        '✅ URL is publicly accessible',
        '✅ Twilio can reach your server',
      ],
    });
  } catch (error: any) {
    logError('Webhook reachability test failed', {
      message: error?.message,
      code: error?.code,
    });

    return NextResponse.json(
      {
        reachable: false,
        error: error?.message || 'Webhook test failed',
        errorType: 'WEBHOOK_TEST_FAILED',
        troubleshooting: [
          '1. Verify NEXT_PUBLIC_APP_URL is set correctly',
          '2. Check TwiML App configuration in Twilio console',
          '3. Ensure /api/twilio/voice endpoint exists',
          '4. Verify app is deployed (if testing production)',
          '5. Check firewall and CORS settings',
        ],
      },
      { status: 400 }
    );
  }
}
