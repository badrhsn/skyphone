import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // For now, return some mock phone numbers since we don't have a phone numbers table yet
    // In a real implementation, you would fetch from a PhoneNumbers table
    const mockNumbers = [
      {
        id: "1",
        phoneNumber: "+1234567890",
        country: "United States",
        countryCode: "+1",
        type: "premium",
        monthlyFee: 5.00,
        isActive: true,
        purchaseDate: new Date().toISOString(),
      }
    ];

    // You could also add some public numbers that are available to all users
    const publicNumbers = [
      {
        id: "public-1",
        phoneNumber: "Anonymous",
        country: "Global",
        countryCode: "",
        type: "public",
        monthlyFee: 0,
        isActive: true,
        purchaseDate: null,
      },
      {
        id: "public-2", 
        phoneNumber: "+1800-YADAPHONE",
        country: "United States",
        countryCode: "+1",
        type: "public",
        monthlyFee: 0,
        isActive: true,
        purchaseDate: null,
      }
    ];

    const allNumbers = [...mockNumbers, ...publicNumbers];

    return NextResponse.json(allNumbers);
  } catch (error) {
    console.error("Error fetching phone numbers:", error);
    return NextResponse.json(
      { error: "Failed to fetch phone numbers" },
      { status: 500 }
    );
  }
}