import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const rates = await prisma.callRate.findMany({
      where: { isActive: true },
      orderBy: { country: "asc" },
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
