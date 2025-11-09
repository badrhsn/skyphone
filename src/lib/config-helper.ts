// Configuration Helper with Environment Fallback
// This helper allows gradual migration from env vars to secure config
// src/lib/config-helper.ts

import { secureConfig } from './secure-config';

interface ConfigOptions {
  fallbackToEnv?: boolean;
  userId?: string;
}

class ConfigHelper {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  // Get configuration with environment fallback
  async getConfig(provider: string, options: ConfigOptions = {}): Promise<Record<string, any> | null> {
  const { fallbackToEnv = true, userId } = options;
    
    try {
      // First try to get from secure database
  const secureConfigData = await secureConfig.getConfig(provider, userId as any);
      
      if (secureConfigData) {
        console.log(`🔐 Using secure config for ${provider}`);
        return secureConfigData;
      }

      // Fallback to environment variables
      if (fallbackToEnv) {
        const envConfig = this.getEnvConfig(provider);
        if (envConfig && Object.keys(envConfig).length > 0) {
          console.log(`⚠️  Using environment variables for ${provider} (consider migrating to secure config)`);
          return envConfig;
        }
      }

      return null;
    } catch (error) {
      console.error(`Error getting config for ${provider}:`, error);
      
      // Fallback to environment variables on error
      if (fallbackToEnv) {
        const envConfig = this.getEnvConfig(provider);
        if (envConfig && Object.keys(envConfig).length > 0) {
          console.log(`⚠️  Fallback to environment variables for ${provider} due to error`);
          return envConfig;
        }
      }
      
      return null;
    }
  }

  // Get specific configuration value
  async getConfigValue(provider: string, key: string, options: ConfigOptions = {}): Promise<string | null> {
    const config = await this.getConfig(provider, options);
    return config?.[key] || null;
  }

  // Environment variable mappings
  private getEnvConfig(provider: string): Record<string, any> | null {
    switch (provider.toUpperCase()) {
      case 'TWILIO':
        return {
          accountSid: process.env.TWILIO_ACCOUNT_SID,
          authToken: process.env.TWILIO_AUTH_TOKEN,
          phoneNumber: process.env.TWILIO_PHONE_NUMBER
        };

      case 'STRIPE':
        return {
          secretKey: process.env.STRIPE_SECRET_KEY,
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
        };

      case 'GOOGLE_OAUTH':
        return {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET
        };

      case 'TELNYX':
        return {
          apiKey: process.env.TELNYX_API_KEY,
          publicKey: process.env.TELNYX_PUBLIC_KEY
        };

      case 'VONAGE':
        return {
          apiKey: process.env.VONAGE_API_KEY,
          apiSecret: process.env.VONAGE_API_SECRET,
          applicationId: process.env.VONAGE_APPLICATION_ID,
          privateKey: process.env.VONAGE_PRIVATE_KEY
        };

      default:
        return null;
    }
  }

  // Check configuration status
  async getConfigStatus(): Promise<{
    provider: string;
    hasSecureConfig: boolean;
    hasEnvConfig: boolean;
    status: 'secure' | 'env' | 'missing';
  }[]> {
    const providers = ['TWILIO', 'STRIPE', 'GOOGLE_OAUTH', 'TELNYX', 'VONAGE'];
    const status = [];

    for (const provider of providers) {
      const secureConfigData = await secureConfig.getConfig(provider);
      const envConfig = this.getEnvConfig(provider);

      const hasSecureConfig = !!secureConfigData;
      const hasEnvConfig = !!(envConfig && Object.values(envConfig).some(v => v));

      let configStatus: 'secure' | 'env' | 'missing' = 'missing';
      if (hasSecureConfig) {
        configStatus = 'secure';
      } else if (hasEnvConfig) {
        configStatus = 'env';
      }

      status.push({
        provider,
        hasSecureConfig,
        hasEnvConfig,
        status: configStatus
      });
    }

    return status;
  }
}

export const configHelper = new ConfigHelper();

// Specific helper functions for each provider
export const getTwilioConfig = (options?: ConfigOptions) => configHelper.getConfig('TWILIO', options);
export const getStripeConfig = (options?: ConfigOptions) => configHelper.getConfig('STRIPE', options);
export const getGoogleOAuthConfig = (options?: ConfigOptions) => configHelper.getConfig('GOOGLE_OAUTH', options);
export const getTelnyxConfig = (options?: ConfigOptions) => {
  // Skip during build to avoid initialization errors
  if (process.env.CI === 'true' || process.env.VERCEL_ENV === 'preview') {
    return Promise.resolve(null);
  }
  return configHelper.getConfig('TELNYX', options);
};

export const getVonageConfig = (options?: ConfigOptions) => {
  // Skip during build to avoid initialization errors
  if (process.env.CI === 'true' || process.env.VERCEL_ENV === 'preview') {
    return Promise.resolve(null);
  }
  return configHelper.getConfig('VONAGE', options);
};