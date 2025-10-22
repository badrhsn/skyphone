import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callerIdCountry = searchParams.get('callerIdCountry') || 'US'; // Default to US

    const rates = await prisma.callRate.findMany({
      where: {
        isActive: true,
        callerIdCountry: callerIdCountry
      } as any,
      orderBy: {
        country: 'asc'
      }
    });

    return NextResponse.json(rates);
  } catch (error) {
    console.error("Error fetching rates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
