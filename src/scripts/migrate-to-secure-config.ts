// Migration utility to move from .env to secure database storage
// src/scripts/migrate-to-secure-config.ts

import { secureConfig } from '../lib/secure-config';

interface ConfigMigration {
  provider: string;
  envKeys: string[];
  transform?: (envData: Record<string, string>) => Record<string, any>;
}

const MIGRATIONS: ConfigMigration[] = [
  {
    provider: 'twilio',
    envKeys: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_API_KEY', 'TWILIO_API_SECRET', 'TWILIO_PHONE_NUMBER'],
    transform: (env) => ({
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
      apiKey: env.TWILIO_API_KEY,
      apiSecret: env.TWILIO_API_SECRET,
      phoneNumber: env.TWILIO_PHONE_NUMBER,
      isActive: true
    })
  },
  {
    provider: 'stripe',
    envKeys: ['STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    transform: (env) => ({
      publishableKey: env.STRIPE_PUBLISHABLE_KEY,
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
      environment: env.STRIPE_SECRET_KEY?.includes('test') ? 'test' : 'live'
    })
  },
  {
    provider: 'google_oauth',
    envKeys: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    transform: (env) => ({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET
    })
  }
];

async function migrateEnvironmentToDatabase() {
  console.log('🔐 Starting migration from environment variables to secure database storage...\n');

  for (const migration of MIGRATIONS) {
    console.log(`📋 Migrating ${migration.provider} configuration...`);
    
    const envData: Record<string, string> = {};
    let hasAllKeys = true;

    // Collect environment variables
    for (const key of migration.envKeys) {
      const value = process.env[key];
      if (value && !value.includes('placeholder')) {
        envData[key] = value;
      } else {
        console.log(`   ⚠️  Missing or placeholder value for ${key}`);
        hasAllKeys = false;
      }
    }

    if (!hasAllKeys) {
      console.log(`   ❌ Skipping ${migration.provider} - missing required environment variables\n`);
      continue;
    }

    try {
      // Transform the data if needed
      const configData = migration.transform ? migration.transform(envData) : envData;
      
      // Store in secure database
      await secureConfig.setConfig(migration.provider, configData, 'system-migration');
      
      console.log(`   ✅ Successfully migrated ${migration.provider} configuration`);
      console.log(`   📊 Stored ${Object.keys(configData).length} configuration keys\n`);
      
    } catch (error) {
      console.error(`   ❌ Failed to migrate ${migration.provider}:`, error);
    }
  }

  console.log('🎉 Migration completed! You can now:');
  console.log('1. Remove sensitive keys from .env files');
  console.log('2. Add them to .gitignore');
  console.log('3. Use secureConfig.getConfig() in your code');
}

// Run migration if called directly
if (require.main === module) {
  migrateEnvironmentToDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateEnvironmentToDatabase };