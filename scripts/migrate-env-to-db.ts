#!/usr/bin/env tsx
// Migration script to move environment variables to secure database storage
// Usage: npx tsx scripts/migrate-env-to-db.ts

import { prisma } from '../src/lib/db';
import { secureConfig } from '../src/lib/secure-config';
import fs from 'fs';
import path from 'path';

async function migrateEnvironmentVariables() {
  console.log('🔐 Starting environment variable migration to secure database...\n');

  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  
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

  let migratedCount = 0;
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
          await secureConfig.setConfig(provider, configData, undefined, 'production');
          console.log(`✅ Migrated ${provider} configuration`);
          console.log(`   Keys: ${Object.keys(configData).join(', ')}`);
          migratedCount++;
        } else {
          console.log(`⚠️  Configuration for ${provider} already exists, skipping...`);
        }
      } catch (error) {
        console.error(`❌ Error migrating ${provider}:`, error);
        errors.push(`Failed to migrate ${provider}: ${error}`);
      }
    } else {
      console.log(`ℹ️  No configuration found for ${provider}`);
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   Migrated configurations: ${migratedCount}`);
  console.log(`   Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(error => console.log(`   - ${error}`));
  }

  if (migratedCount > 0) {
    // Create backup of original .env file
    const backupPath = path.join(process.cwd(), `.env.local.backup.${Date.now()}`);
    fs.writeFileSync(backupPath, envContent);
    console.log(`\n💾 Backup created: ${backupPath}`);
    
    console.log('\n⚠️  NEXT STEPS:');
    console.log('   1. Set CONFIG_ENCRYPTION_KEY in your environment');
    console.log('   2. Remove sensitive variables from .env.local');
    console.log('   3. Update your application code to use secureConfig');
    console.log('   4. Test your application thoroughly');
  }

  await prisma.$disconnect();
}

// Run migration
migrateEnvironmentVariables().catch(console.error);