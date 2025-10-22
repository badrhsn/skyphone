import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { secureConfig } from "@/lib/secure-config";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.isAdmin && session.user.email !== 'admin@yadaphone.com') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { provider, configData } = await request.json();

    if (!provider || !configData) {
      return NextResponse.json({ error: "Provider and configData are required" }, { status: 400 });
    }

    // Test the configuration based on provider
    let testResult = { success: false, message: '', details: {} };

    try {
      switch (provider.toUpperCase()) {
        case 'TWILIO':
          testResult = await testTwilioConfig(configData);
          break;
        case 'STRIPE':
          testResult = await testStripeConfig(configData);
          break;
        case 'GOOGLE_OAUTH':
          testResult = await testGoogleOAuthConfig(configData);
          break;
        case 'TELNYX':
          testResult = await testTelnyxConfig(configData);
          break;
        case 'VONAGE':
          testResult = await testVonageConfig(configData);
          break;
        default:
          testResult.message = `Testing not implemented for provider: ${provider}`;
      }
    } catch (error) {
      testResult.message = `Test failed with error: ${error}`;
    }

    return NextResponse.json(testResult);

  } catch (error) {
    console.error("Error testing configuration:", error);
    return NextResponse.json(
      { error: "Failed to test configuration" },
      { status: 500 }
    );
  }
}

async function testTwilioConfig(config: any) {
  try {
    const { accountSid, authToken } = config;

    if (!accountSid || !authToken) {
      return { success: false, message: 'Missing required Twilio credentials' };
    }

    // Create a simple test request to Twilio API
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Twilio configuration is valid',
        details: {
          accountSid: data.sid,
          friendlyName: data.friendly_name,
          status: data.status
        }
      };
    } else {
      return { success: false, message: `Twilio API error: ${response.status}` };
    }
  } catch (error) {
    return { success: false, message: `Twilio test failed: ${error}` };
  }
}

async function testStripeConfig(config: any) {
  try {
    const { secretKey } = config;

    if (!secretKey) {
      return { success: false, message: 'Missing Stripe secret key' };
    }

    // Test Stripe API with a simple account retrieval
    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Bearer ${secretKey}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Stripe configuration is valid',
        details: {
          accountId: data.id,
          businessProfile: data.business_profile?.name || 'N/A',
          country: data.country
        }
      };
    } else {
      return { success: false, message: `Stripe API error: ${response.status}` };
    }
  } catch (error) {
    return { success: false, message: `Stripe test failed: ${error}` };
  }
}

async function testGoogleOAuthConfig(config: any) {
  try {
    const { clientId, clientSecret } = config;

    if (!clientId || !clientSecret) {
      return { success: false, message: 'Missing Google OAuth credentials' };
    }

    // Basic validation - check if credentials look valid
    if (!clientId.includes('.googleusercontent.com')) {
      return { success: false, message: 'Invalid Google Client ID format' };
    }

    return {
      success: true,
      message: 'Google OAuth configuration appears valid',
      details: {
        clientId: clientId.substring(0, 20) + '...',
        format: 'Valid'
      }
    };
  } catch (error) {
    return { success: false, message: `Google OAuth test failed: ${error}` };
  }
}

async function testTelnyxConfig(config: any) {
  try {
    const { apiKey } = config;

    if (!apiKey) {
      return { success: false, message: 'Missing Telnyx API key' };
    }

    // Test Telnyx API
    const response = await fetch('https://api.telnyx.com/v2/phone_numbers', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return {
        success: true,
        message: 'Telnyx configuration is valid',
        details: {
          status: 'Connected to Telnyx API'
        }
      };
    } else {
      return { success: false, message: `Telnyx API error: ${response.status}` };
    }
  } catch (error) {
    return { success: false, message: `Telnyx test failed: ${error}` };
  }
}

async function testVonageConfig(config: any) {
  try {
    const { apiKey, apiSecret } = config;

    if (!apiKey || !apiSecret) {
      return { success: false, message: 'Missing Vonage credentials' };
    }

    // Test Vonage API with account balance check
    const response = await fetch(`https://rest.nexmo.com/account/get-balance?api_key=${apiKey}&api_secret=${apiSecret}`);

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Vonage configuration is valid',
        details: {
          balance: data.value,
          autoReload: data.autoReload
        }
      };
    } else {
      return { success: false, message: `Vonage API error: ${response.status}` };
    }
  } catch (error) {
    return { success: false, message: `Vonage test failed: ${error}` };
  }
}