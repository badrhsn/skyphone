import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get user count
    const userCount = await prisma.user.count();

    // Get country count from call rates
    const countryCount = await prisma.callRate.count({
      where: { isActive: true }
    });

    // Calculate success rate from call analytics
    const totalCalls = await prisma.callAnalytics.count();
    const successfulCalls = await prisma.callAnalytics.count({
      where: {
        status: {
          in: ['SUCCESS', 'FAILOVER_SUCCESS']
        }
      }
    });
    
    const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 99.9;

    // Get average rating (placeholder for now, can be implemented with reviews table later)
    const rating = 4.9;

    // Get total calls made
    const totalCallsMade = await prisma.call.count();

    // Get provider status for uptime calculation
    const providerStats = await prisma.providerStatus.findMany();
    const avgUptime = providerStats.length > 0 
      ? providerStats.reduce((acc, provider) => acc + provider.successRate, 0) / providerStats.length
      : 99.9;

    // Get recent activity stats
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: lastMonth
        }
      }
    });

    const recentCalls = await prisma.call.count({
      where: {
        createdAt: {
          gte: lastMonth
        }
      }
    });

    // Get total revenue (sum of completed payments)
    const totalRevenue = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED'
      },
      _sum: {
        amount: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: userCount,
          recent: recentUsers,
          display: userCount > 1000 ? `${Math.floor(userCount / 1000)}K+` : userCount.toString()
        },
        countries: {
          total: countryCount,
          display: `${countryCount}+`
        },
        uptime: {
          percentage: Math.round(avgUptime * 10) / 10,
          display: `${Math.round(avgUptime * 10) / 10}%`
        },
        rating: {
          score: rating,
          display: `${rating}/5`
        },
        calls: {
          total: totalCallsMade,
          recent: recentCalls,
          display: totalCallsMade > 1000000 ? `${Math.floor(totalCallsMade / 1000000)}M+` : 
                   totalCallsMade > 1000 ? `${Math.floor(totalCallsMade / 1000)}K+` : 
                   totalCallsMade.toString()
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
          display: totalRevenue._sum.amount ? `$${Math.floor(totalRevenue._sum.amount / 1000)}K+` : '$0'
        },
        successRate: {
          percentage: Math.round(successRate * 10) / 10,
          display: `${Math.round(successRate * 10) / 10}%`
        }
      }
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    
    // Return fallback data in case of error
    return NextResponse.json({
      success: false,
      data: {
        users: { total: 1000, recent: 50, display: "1K+" },
        countries: { total: 247, display: "247+" },
        uptime: { percentage: 99.9, display: "99.9%" },
        rating: { score: 4.9, display: "4.9/5" },
        calls: { total: 10000, recent: 500, display: "10K+" },
        revenue: { total: 50000, display: "$50K+" },
        successRate: { percentage: 99.9, display: "99.9%" }
      }
    });
  }
}