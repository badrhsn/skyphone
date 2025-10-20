import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rates = await prisma.callRate.findMany({
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

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rateId, isActive } = await request.json();

    if (!rateId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Rate ID and isActive status are required" },
        { status: 400 }
      );
    }

    const updatedRate = await prisma.callRate.update({
      where: { id: rateId },
      data: { isActive },
    });

    return NextResponse.json(updatedRate);
  } catch (error) {
    console.error("Error updating rate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
