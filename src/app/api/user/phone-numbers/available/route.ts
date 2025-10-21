import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchAvailableNumbers, searchTollFreeNumbers } from "@/lib/twilio";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const country = url.searchParams.get("country") || "United States";
    const numberType = url.searchParams.get("type") || "all"; // local, toll-free, or all
    const areaCode = url.searchParams.get("areaCode") || "";

    // Map country names to country codes
    const countryMap: { [key: string]: string } = {
      "United States": "US",
      "Canada": "CA"
    };

    const countryCode = countryMap[country];
    
    if (!countryCode) {
      return NextResponse.json({ 
        error: "Currently only US and Canada numbers are supported" 
      }, { status: 400 });
    }

    let availableNumbers: any[] = [];

    try {
      // Fetch local numbers
      if (numberType === "local" || numberType === "all") {
        const localNumbers = await searchAvailableNumbers(countryCode, areaCode);
        availableNumbers = [...availableNumbers, ...localNumbers];
      }

      // Fetch toll-free numbers
      if (numberType === "toll-free" || numberType === "all") {
        const tollFreeNumbers = await searchTollFreeNumbers(countryCode);
        availableNumbers = [...availableNumbers, ...tollFreeNumbers];
      }

      // Format the response
      const formattedNumbers = availableNumbers.map((number: any, index: number) => ({
        id: `twilio_${index}`,
        phoneNumber: number.phoneNumber,
        country: country,
        countryCode: countryCode === "US" ? "+1" : "+1", // Both US and CA use +1
        city: number.locality || number.region || number.city,
        type: number.phoneNumber.includes("800") || number.phoneNumber.includes("888") || 
              number.phoneNumber.includes("877") || number.phoneNumber.includes("866") || 
              number.phoneNumber.includes("855") || number.phoneNumber.includes("844") ? "toll-free" : "local",
        monthlyPrice: number.monthlyPrice,
        setupFee: number.setupFee,
        capabilities: number.capabilities
      }));

      return NextResponse.json(formattedNumbers);

    } catch (twilioError) {
      console.error("Twilio API error:", twilioError);
      
      // Return fallback mock data if Twilio API fails
      const fallbackNumbers = [
        {
          id: "fallback_1",
          phoneNumber: "+1 (555) 123-4567",
          country: country,
          countryCode: "+1",
          city: countryCode === "US" ? "New York" : "Toronto",
          type: "local",
          monthlyPrice: countryCode === "US" ? 2.00 : 2.50,
          setupFee: 2.00,
          capabilities: { voice: true, sms: true, fax: false }
        },
        {
          id: "fallback_2",
          phoneNumber: "+1 (555) 987-6543",
          country: country,
          countryCode: "+1",
          city: countryCode === "US" ? "Los Angeles" : "Vancouver", 
          type: "local",
          monthlyPrice: countryCode === "US" ? 2.00 : 2.50,
          setupFee: 2.00,
          capabilities: { voice: true, sms: true, fax: true }
        },
        {
          id: "fallback_3",
          phoneNumber: "+1 (800) 555-0123",
          country: country,
          countryCode: "+1",
          type: "toll-free",
          monthlyPrice: countryCode === "US" ? 4.00 : 5.00,
          setupFee: 10.00,
          capabilities: { voice: true, sms: false, fax: false }
        }
      ];

      return NextResponse.json(fallbackNumbers);
    }

  } catch (error) {
    console.error("Error fetching available numbers:", error);
    return NextResponse.json(
      { error: "Failed to fetch available numbers" },
      { status: 500 }
    );
  }
}