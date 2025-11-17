import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * Call History & Analytics API
 * Provides comprehensive call statistics and history
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const days = request.nextUrl.searchParams.get("days") || "30";
    const daysNum = parseInt(days);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Get all calls in the date range
    const calls = await prisma.call.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            balance: true,
          },
        },
      },
    });

    // Calculate analytics
    const analytics = {
      period: {
        start: startDate,
        end: endDate,
        days: daysNum,
      },
      callStats: {
        total: calls.length,
        completed: calls.filter((c) => c.status === "COMPLETED").length,
        failed: calls.filter((c) => c.status === "FAILED").length,
        cancelled: calls.filter((c) => c.status === "CANCELLED").length,
      },
      timeStats: {
        totalDuration: calls.reduce((sum, c) => sum + c.duration, 0),
        averageDuration:
          calls.length > 0
            ? Math.round(calls.reduce((sum, c) => sum + c.duration, 0) / calls.length)
            : 0,
        maxDuration: Math.max(...calls.map((c) => c.duration), 0),
      },
      costStats: {
        totalCost: calls.reduce((sum, c) => sum + c.cost, 0),
        averageCost:
          calls.length > 0
            ? (calls.reduce((sum, c) => sum + c.cost, 0) / calls.length).toFixed(4)
            : 0,
        minCost: Math.min(...calls.map((c) => c.cost), 0),
        maxCost: Math.max(...calls.map((c) => c.cost), 0),
      },
      topCountries: getTopCountries(calls),
      topNumbers: getTopNumbers(calls),
      dailyStats: getDailyStats(calls, startDate, daysNum),
      recentCalls: calls.slice(0, 20).map((call) => ({
        id: call.id,
        toNumber: call.toNumber,
        country: call.country,
        duration: call.duration,
        cost: call.cost,
        status: call.status,
        timestamp: call.createdAt,
      })),
    };

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("❌ [Analytics API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Get top countries called in the period
 */
function getTopCountries(
  calls: Array<{
    country: string;
    duration: number;
    cost: number;
  }>
) {
  const countries: Record<string, { count: number; cost: number; duration: number }> = {};

  calls.forEach((call) => {
    if (!countries[call.country]) {
      countries[call.country] = { count: 0, cost: 0, duration: 0 };
    }
    countries[call.country].count++;
    countries[call.country].cost += call.cost;
    countries[call.country].duration += call.duration;
  });

  return Object.entries(countries)
    .map(([country, stats]) => ({
      country,
      ...stats,
      averageDuration: Math.round(stats.duration / stats.count),
      averageCost: (stats.cost / stats.count).toFixed(4),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Get top numbers called in the period
 */
function getTopNumbers(
  calls: Array<{
    toNumber: string;
    country: string;
    duration: number;
    cost: number;
  }>
) {
  const numbers: Record<
    string,
    { count: number; cost: number; duration: number; country: string }
  > = {};

  calls.forEach((call) => {
    if (!numbers[call.toNumber]) {
      numbers[call.toNumber] = { count: 0, cost: 0, duration: 0, country: call.country };
    }
    numbers[call.toNumber].count++;
    numbers[call.toNumber].cost += call.cost;
    numbers[call.toNumber].duration += call.duration;
  });

  return Object.entries(numbers)
    .map(([number, stats]) => ({
      number,
      ...stats,
      averageDuration: Math.round(stats.duration / stats.count),
      averageCost: (stats.cost / stats.count).toFixed(4),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Get daily statistics for the period
 */
function getDailyStats(
  calls: Array<{
    createdAt: Date;
    duration: number;
    cost: number;
    status: string;
  }>,
  startDate: Date,
  daysNum: number
) {
  const dailyData: Record<
    string,
    { count: number; duration: number; cost: number; completed: number }
  > = {};

  // Initialize all days with zero values
  for (let i = 0; i < daysNum; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    dailyData[dateStr] = { count: 0, duration: 0, cost: 0, completed: 0 };
  }

  // Populate with call data
  calls.forEach((call) => {
    const dateStr = call.createdAt.toISOString().split("T")[0];
    if (dailyData[dateStr]) {
      dailyData[dateStr].count++;
      dailyData[dateStr].duration += call.duration;
      dailyData[dateStr].cost += call.cost;
      if (call.status === "COMPLETED") {
        dailyData[dateStr].completed++;
      }
    }
  });

  return Object.entries(dailyData)
    .map(([date, stats]) => ({
      date,
      ...stats,
      successRate:
        stats.count > 0
          ? Math.round((stats.completed / stats.count) * 100)
          : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
