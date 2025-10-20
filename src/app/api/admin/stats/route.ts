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

    const [
      totalUsers,
      totalRevenue,
      totalCalls,
      activeUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.call.count(),
      prisma.user.count({
        where: {
          balance: { gt: 0 },
        },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalCalls,
      activeUsers,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
