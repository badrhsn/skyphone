import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { secureConfig } from "@/lib/secure-config";
import fs from 'fs';
import path from 'path';

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

    const { includeBackup = true } = await request.json();

    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch (error) {
      return NextResponse.json({ error: "Could not read .env.local file" }, { status: 400 });
    }

    // Parse environment variables
    const envVars: Record<string, string> = {};
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').replace(/^["'](.*)["']$/, '$1');
        }
      }
    }

    // Define configuration mappings
    const configMappings = {
      TWILIO: {
        TWILIO_ACCOUNT_SID: 'accountSid',
        TWILIO_AUTH_TOKEN: 'authToken',
        TWILIO_PHONE_NUMBER: 'phoneNumber'
      },
      STRIPE: {
        STRIPE_SECRET_KEY: 'secretKey',
        STRIPE_PUBLISHABLE_KEY: 'publishableKey',
        STRIPE_WEBHOOK_SECRET: 'webhookSecret'
      },
      GOOGLE_OAUTH: {
        GOOGLE_CLIENT_ID: 'clientId',
        GOOGLE_CLIENT_SECRET: 'clientSecret'
      },
      TELNYX: {
        TELNYX_API_KEY: 'apiKey',
        TELNYX_PUBLIC_KEY: 'publicKey'
      },
      VONAGE: {
        VONAGE_API_KEY: 'apiKey',
        VONAGE_API_SECRET: 'apiSecret',
        VONAGE_APPLICATION_ID: 'applicationId',
        VONAGE_PRIVATE_KEY: 'privateKey'
      }
    };

    const migratedConfigs: string[] = [];
    const errors: string[] = [];

    // Migrate each provider's configuration
    for (const [provider, mapping] of Object.entries(configMappings)) {
      const configData: Record<string, any> = {};
      let hasAnyConfig = false;

      for (const [envKey, configKey] of Object.entries(mapping)) {
        if (envVars[envKey]) {
          configData[configKey] = envVars[envKey];
          hasAnyConfig = true;
        }
      }

      if (hasAnyConfig) {
        try {
          // Check if configuration already exists
          const existingConfig = await prisma.apiConfiguration.findFirst({
            where: { provider }
          });

          if (!existingConfig) {
            await secureConfig.setConfig(provider, configData, user.id, 'production');
            migratedConfigs.push(provider);
          } else {
            console.log(`Configuration for ${provider} already exists, skipping...`);
          }
        } catch (error) {
          console.error(`Error migrating ${provider}:`, error);
          errors.push(`Failed to migrate ${provider}: ${error}`);
        }
      }
    }

    // Create backup of original .env file if requested
    if (includeBackup && migratedConfigs.length > 0) {
      const backupPath = path.join(process.cwd(), `.env.local.backup.${Date.now()}`);
      try {
        fs.writeFileSync(backupPath, envContent);
      } catch (error) {
        console.error('Failed to create backup:', error);
        errors.push('Failed to create backup file');
      }
    }

    return NextResponse.json({
      success: true,
      migratedConfigs,
      errors,
      message: `Successfully migrated ${migratedConfigs.length} configurations${includeBackup ? ' (backup created)' : ''}`
    });

  } catch (error) {
    console.error("Error during migration:", error);
    return NextResponse.json(
      { error: "Failed to migrate configurations" },
      { status: 500 }
    );
  }
}