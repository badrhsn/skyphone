import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      autoTopupEnabled: (user as any).autoTopupEnabled || false,
      autoTopupThreshold: (user as any).autoTopupThreshold || 2.0,
      autoTopupAmount: (user as any).autoTopupAmount || 10.0,
    });

  } catch (error) {
    console.error("Error fetching auto top-up settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch auto top-up settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { autoTopupEnabled, autoTopupThreshold, autoTopupAmount } = body;

    // Validate inputs
    if (typeof autoTopupEnabled !== "boolean") {
      return NextResponse.json(
        { error: "autoTopupEnabled must be a boolean" },
        { status: 400 }
      );
    }

    if (autoTopupEnabled) {
      if (!autoTopupThreshold || autoTopupThreshold < 1) {
        return NextResponse.json(
          { error: "Auto top-up threshold must be at least $1" },
          { status: 400 }
        );
      }

      if (!autoTopupAmount || autoTopupAmount < 5) {
        return NextResponse.json(
          { error: "Auto top-up amount must be at least $5" },
          { status: 400 }
        );
      }

      if (autoTopupThreshold >= autoTopupAmount) {
        return NextResponse.json(
          { error: "Auto top-up amount must be greater than threshold" },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        ...(autoTopupEnabled !== undefined && { autoTopupEnabled }),
        ...(autoTopupThreshold !== undefined && { autoTopupThreshold: autoTopupEnabled ? Number(autoTopupThreshold) : 2.0 }),
        ...(autoTopupAmount !== undefined && { autoTopupAmount: autoTopupEnabled ? Number(autoTopupAmount) : 10.0 }),
        updatedAt: new Date(),
      } as any,
    });

    return NextResponse.json({
      message: "Auto top-up settings updated successfully",
      settings: {
        autoTopupEnabled: (updatedUser as any).autoTopupEnabled,
        autoTopupThreshold: (updatedUser as any).autoTopupThreshold,
        autoTopupAmount: (updatedUser as any).autoTopupAmount,
      },
    });

  } catch (error) {
    console.error("Error updating auto top-up settings:", error);
    return NextResponse.json(
      { error: "Failed to update auto top-up settings" },
      { status: 500 }
    );
  }
}