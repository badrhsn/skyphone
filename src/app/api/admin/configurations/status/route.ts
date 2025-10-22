import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { configHelper } from "@/lib/config-helper";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (!session.user.isAdmin && session.user.email !== 'admin@yadaphone.com') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const configStatus = await configHelper.getConfigStatus();

    return NextResponse.json({
      status: configStatus,
      summary: {
        total: configStatus.length,
        secure: configStatus.filter(s => s.status === 'secure').length,
        environment: configStatus.filter(s => s.status === 'env').length,
        missing: configStatus.filter(s => s.status === 'missing').length
      }
    });

  } catch (error) {
    console.error("Error getting configuration status:", error);
    return NextResponse.json(
      { error: "Failed to get configuration status" },
      { status: 500 }
    );
  }
}