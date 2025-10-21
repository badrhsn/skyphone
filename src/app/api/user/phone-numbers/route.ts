import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse capabilities from JSON string and format the response
    const formattedNumbers = phoneNumbers.map(number => ({
      id: number.id,
      phoneNumber: number.phoneNumber,
      country: number.country,
      countryCode: number.countryCode,
      city: number.city,
      type: number.type.toLowerCase().replace('_', '-'),
      monthlyPrice: number.monthlyPrice,
      setupFee: number.setupFee,
      isActive: number.isActive,
      capabilities: JSON.parse(number.capabilities),
      purchaseDate: number.purchaseDate.toISOString(),
      nextBilling: number.nextBilling.toISOString(),
      twilioSid: number.twilioSid,
    }));

    return NextResponse.json(formattedNumbers);
  } catch (error) {
    console.error("Error fetching user phone numbers:", error);
    return NextResponse.json(
      { error: "Failed to fetch phone numbers" },
      { status: 500 }
    );
  }
}