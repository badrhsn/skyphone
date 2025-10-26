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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '24h';
    
    // Calculate date range
    let startDate: Date;
    const now = new Date();
    
    switch (timeframe) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get real call analytics from database
    const callAnalytics = await prisma.callAnalytics.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const providerStats = await prisma.providerStatus.findMany({
      orderBy: {
        successRate: 'desc',
      },
    });

    // Calculate real analytics
    const totalCalls = callAnalytics.length;
    const successfulCalls = callAnalytics.filter(call => call.status === 'SUCCESS').length;
    const failedCalls = totalCalls - successfulCalls;
    const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
    const avgResponseTime = totalCalls > 0 
      ? callAnalytics.reduce((sum, call) => sum + (call.responseTime || 0), 0) / totalCalls 
      : 0;

    // Provider statistics
    const providerStatsFormatted = providerStats.map(p => ({
      provider: p.provider,
      successRate: p.successRate,
      avgResponseTime: p.avgResponseTime,
      totalCalls: 0, // total calls not tracked on ProviderStatus; computed elsewhere if needed
      isActive: p.isActive,
    }));

    // If no provider stats in DB, include current providers with default values
    if (providerStatsFormatted.length === 0) {
      providerStatsFormatted.push({
        provider: 'twilio',
        successRate: successRate,
        avgResponseTime: avgResponseTime,
        totalCalls: totalCalls,
        isActive: true,
      });
    }

    // Country statistics from call analytics
    const countryStats = callAnalytics.reduce((acc, call) => {
      const country = (call as any).countryCode || 'Unknown';
      if (!acc[country]) {
        acc[country] = { calls: 0, successful: 0 };
      }
      acc[country].calls++;
      if (call.status === 'SUCCESS') {
        acc[country].successful++;
      }
      return acc;
    }, {} as Record<string, { calls: number; successful: number }>);

    const countryStatsFormatted = Object.entries(countryStats)
      .map(([country, stats]) => ({
        country,
        calls: stats.calls,
        successRate: stats.calls > 0 ? (stats.successful / stats.calls) * 100 : 0,
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10); // Top 10 countries

    // Hourly statistics
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => {
      const hourStart = new Date(startDate);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hour + 1, 0, 0, 0);

      const hourCalls = callAnalytics.filter(call => {
        const callHour = new Date(call.createdAt).getHours();
        return callHour === hour;
      });

      const successful = hourCalls.filter(call => call.status === 'SUCCESS').length;
      
      return {
        hour,
        calls: hourCalls.length,
        successRate: hourCalls.length > 0 ? (successful / hourCalls.length) * 100 : 0,
      };
    });

    const realAnalytics = {
      totalCalls,
      successfulCalls,
      failedCalls,
      successRate: Math.round(successRate * 10) / 10,
      avgResponseTime: Math.round(avgResponseTime),
      providerStats: providerStatsFormatted,
      countryStats: countryStatsFormatted,
      hourlyStats,
    };

    return NextResponse.json({
      timeframe,
      startDate,
      endDate: now,
      analytics: realAnalytics,
    });

  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}