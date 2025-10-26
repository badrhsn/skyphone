import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { secureConfig } from "@/lib/secure-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.isAdmin && session.user.email !== 'admin@yadaphone.com') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Resolve configuration by provider then fetch audits by configurationId
    const apiConfig = await prisma.apiConfiguration.findUnique({ where: { provider: provider.toUpperCase() } });

    if (!apiConfig) {
      return NextResponse.json({ error: 'Provider configuration not found' }, { status: 404 });
    }

    const auditRecords = await prisma.configurationAudit.findMany({
      where: { configurationId: apiConfig.id },
      include: {
        user: {
          select: { email: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json(auditRecords);

  } catch (error) {
    console.error("Error fetching audit trail:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit trail" },
      { status: 500 }
    );
  }
}