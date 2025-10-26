import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { secureConfig } from "@/lib/secure-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const configuration = await prisma.apiConfiguration.findUnique({
      where: { id }
    });

    if (!configuration) {
      return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    }

  // Get decrypted configuration data
  const uid = user?.id ?? (session.user?.id as string) ?? undefined;
  const configData = await secureConfig.getConfig(configuration.provider, uid);

    return NextResponse.json({
      ...configuration,
      configData
    });

  } catch (error) {
    console.error("Error fetching configuration:", error);
    return NextResponse.json(
      { error: "Failed to fetch configuration" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const { description, environment, configData } = body;

    const configuration = await prisma.apiConfiguration.findUnique({
      where: { id }
    });

    if (!configuration) {
      return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    }

    // Update configuration data if provided
    if (configData && user) {
      const uid2 = user?.id ?? (session.user?.id as string) ?? undefined;
      await secureConfig.setConfig(configuration.provider, configData, uid2);
    }

    // Update metadata
    await prisma.apiConfiguration.update({
      where: { id },
      data: {
        description,
        environment: environment || configuration.environment,
        updatedAt: new Date(),
        version: `${Date.now()}`
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error updating configuration:", error);
    return NextResponse.json(
      { error: "Failed to update configuration" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const configuration = await prisma.apiConfiguration.findUnique({
      where: { id }
    });

    if (!configuration) {
      return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    }

    // Deactivate configuration
    if (user) {
      const uid3 = user?.id ?? (session.user?.id as string) ?? undefined;
      await secureConfig.deactivateConfig(configuration.provider, uid3);
    }

    // Delete from database
    await prisma.apiConfiguration.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting configuration:", error);
    return NextResponse.json(
      { error: "Failed to delete configuration" },
      { status: 500 }
    );
  }
}