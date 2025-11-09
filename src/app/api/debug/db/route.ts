import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Test database connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    // Count users
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      status: "success",
      dbConnected: true,
      testQuery: result,
      userCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Database debug error:", error);
    return NextResponse.json({
      status: "error",
      dbConnected: false,
      error: error.message,
      errorName: error.name,
      errorCode: error.code,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
