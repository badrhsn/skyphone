// Environment-only Configuration Helper
// This helper now reads provider configuration exclusively from environment variables.
// No database-backed configuration is used anymore.

interface ConfigOptions {
  fallbackToEnv?: boolean;
  userId?: string;
}

class ConfigHelper {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  // Get configuration from environment variables only
  async getConfig(provider: string, _options: ConfigOptions = {}): Promise<Record<string, any> | null> {
    const envConfig = this.getEnvConfig(provider);
    return envConfig && Object.values(envConfig).some(Boolean) ? envConfig : null;
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



      default:
        return null;
    }
  }

  // Check configuration status (env-based only)
  async getConfigStatus(): Promise<{
    provider: string;
    hasEnvConfig: boolean;
    status: 'env' | 'missing';
  }[]> {
    const providers = ['TWILIO', 'STRIPE', 'GOOGLE_OAUTH'];
    const status = [];

    for (const provider of providers) {
      const envConfig = this.getEnvConfig(provider);
      const hasEnvConfig = !!(envConfig && Object.values(envConfig).some(v => v));

      const configStatus: 'env' | 'missing' = hasEnvConfig ? 'env' : 'missing';

      status.push({
        provider,
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
