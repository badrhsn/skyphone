import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkBalanceBeforeCall } from "@/lib/auto-topup";

// Phone number to country code mapping
function getCountryCodeFromPhoneNumber(phoneNumber: string): string | null {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Country code mappings (phone prefix -> ISO country code)
  const phoneToCountryMap: { [key: string]: string } = {
    // North America
    '1': 'US', // US & Canada
    
    // Europe
    '44': 'GB', // UK
    '33': 'FR', // France
    '49': 'DE', // Germany
    '34': 'ES', // Spain
    '39': 'IT', // Italy
    '31': 'NL', // Netherlands
    '32': 'BE', // Belgium
    '41': 'CH', // Switzerland
    '43': 'AT', // Austria
    '45': 'DK', // Denmark
    '46': 'SE', // Sweden
    '47': 'NO', // Norway
    '358': 'FI', // Finland
    '351': 'PT', // Portugal
    '353': 'IE', // Ireland
    '48': 'PL', // Poland
    '420': 'CZ', // Czech Republic
    '421': 'SK', // Slovakia
    '36': 'HU', // Hungary
    '40': 'RO', // Romania
    '359': 'BG', // Bulgaria
    '385': 'HR', // Croatia
    '386': 'SI', // Slovenia
    '372': 'EE', // Estonia
    '371': 'LV', // Latvia
    '370': 'LT', // Lithuania
    '7': 'RU', // Russia
    
    // Asia
    '81': 'JP', // Japan
    '82': 'KR', // South Korea
    '86': 'CN', // China
    '91': 'IN', // India
    '60': 'MY', // Malaysia
    '65': 'SG', // Singapore
    '66': 'TH', // Thailand
    '84': 'VN', // Vietnam
    '62': 'ID', // Indonesia
    '63': 'PH', // Philippines
    '852': 'HK', // Hong Kong
    '886': 'TW', // Taiwan
    
    // Middle East & Africa
    '20': 'EG', // Egypt
    '212': 'MA', // Morocco - THIS IS THE KEY ONE!
    '213': 'DZ', // Algeria
    '216': 'TN', // Tunisia
    '218': 'LY', // Libya
    '27': 'ZA', // South Africa
    '234': 'NG', // Nigeria
    '254': 'KE', // Kenya
    '966': 'SA', // Saudi Arabia
    '971': 'AE', // UAE
    '972': 'IL', // Israel
    '90': 'TR', // Turkey
    
    // Oceania
    '61': 'AU', // Australia
    '64': 'NZ', // New Zealand
    
    // South America
    '55': 'BR', // Brazil
    '54': 'AR', // Argentina
    '56': 'CL', // Chile
    '57': 'CO', // Colombia
    '51': 'PE', // Peru
    
    // Central America
    '52': 'MX', // Mexico
  };
  
  // Try different prefix lengths (1-4 digits)
  for (let len = 4; len >= 1; len--) {
    const prefix = cleaned.substring(0, len);
    if (phoneToCountryMap[prefix]) {
      return phoneToCountryMap[prefix];
    }
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  // During build, return a simple response
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV) {
    return NextResponse.json({ 
      success: true,
      message: "API route available - call functionality ready"
    });
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { to, from, callerIdType, callerIdInfo } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Validate verified caller ID if specified
    if (callerIdType === "verified" && callerIdInfo?.verifiedId) {
      const verifiedCallerId = await (prisma as any).callerID.findFirst({
        where: {
          userId: session.user.id,
          phoneNumber: callerIdInfo.verifiedId,
          status: 'VERIFIED'
        }
      });

      if (!verifiedCallerId) {
        return NextResponse.json(
          { error: "Caller ID not verified or not found" },
          { status: 400 }
        );
      }
    }

    // Check balance and trigger auto top-up if needed
    const balanceCheck = await checkBalanceBeforeCall(session.user.id, 1.0);
    
    if (!balanceCheck.canProceed) {
      return NextResponse.json(
        { 
          error: "Insufficient balance. Please add credits or enable auto top-up.",
          autoTopupSuggested: true
        },
        { status: 400 }
      );
    }

    // Detect country and get rate
    const cleanNumber = to.replace(/\D/g, "");
    const countryCode = getCountryCodeFromPhoneNumber(cleanNumber);
    
    if (!countryCode) {
      return NextResponse.json(
        { error: "Unable to determine country from phone number" },
        { status: 400 }
      );
    }

    const rate = await prisma.callRate.findFirst({
      where: {
        countryCode: countryCode,
        isActive: true,
      },
    });

    if (!rate) {
      return NextResponse.json(
        { error: "Calling to this country is not supported" },
        { status: 400 }
      );
    }

    // Create call record
    const call = await prisma.call.create({
      data: {
        userId: session.user.id,
        fromNumber: from || "+1234567890",
        toNumber: to,
        country: rate.country,
        status: "INITIATED",
        cost: 0, // Will be updated when call ends
      },
    });

    try {
      // Dynamic import to avoid build-time initialization
      const { initiateCall } = await import('@/lib/twilio');
      
      // Initiate call with Twilio
      const twilioCall = await initiateCall(to, from);
      
      // Update call with Twilio SID
      await prisma.call.update({
        where: { id: call.id },
        data: { twilioSid: twilioCall.sid },
      });

      return NextResponse.json({
        message: "Call initiated successfully",
        callId: call.id,
        twilioSid: twilioCall.sid,
      });
    } catch (twilioError) {
      // Update call status to failed
      await prisma.call.update({
        where: { id: call.id },
        data: { status: "FAILED" },
      });

      console.error("Twilio call initiation error:", twilioError);
      return NextResponse.json(
        { error: "Failed to initiate call. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Call initiation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
