import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { secureConfig } from "@/lib/secure-config";

export async function GET(request: NextRequest) {
  try {
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

    // Get all configurations (without sensitive data)
    const configurations = await prisma.apiConfiguration.findMany({
      select: {
        id: true,
        provider: true,
        isActive: true,
        environment: true,
        createdAt: true,
        updatedAt: true,
        lastUsed: true,
        version: true,
        description: true,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(configurations);

  } catch (error) {
    console.error("Error fetching configurations:", error);
    return NextResponse.json(
      { error: "Failed to fetch configurations" },
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.isAdmin && session.user.email !== 'admin@yadaphone.com') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { provider, description, environment, configData } = body;

    // Validate required fields
    if (!provider || !configData || Object.keys(configData).length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if provider already exists
    const existingConfig = await prisma.apiConfiguration.findUnique({
      where: { provider }
    });

    if (existingConfig) {
      return NextResponse.json({ error: "Configuration for this provider already exists" }, { status: 409 });
    }

  // Store configuration using secure config manager
  const uid = user?.id ?? (session.user?.id as string) ?? undefined;
  await secureConfig.setConfig(provider, configData, uid);

    // Update description if provided
    if (description) {
      await prisma.apiConfiguration.update({
        where: { provider },
        data: { 
          description,
          environment: environment || 'production'
        }
      });
    }

    return NextResponse.json({ success: true, provider });

  } catch (error) {
    console.error("Error creating configuration:", error);
    return NextResponse.json(
      { error: "Failed to create configuration" },
      { status: 500 }
    );
  }
}