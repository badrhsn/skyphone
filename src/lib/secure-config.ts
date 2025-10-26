// Secure Configuration Manager
// src/lib/secure-config.ts

import crypto from 'crypto';
import { prisma } from './db';

// Encryption utilities
const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY || 'default-dev-key-change-in-prod';
const ALGORITHM = 'aes-256-gcm';

interface ProviderConfig {
  [key: string]: string | number | boolean;
}

interface CacheEntry {
  data: ProviderConfig;
  timestamp: number;
}

class SecureConfigManager {
  private static instance: SecureConfigManager;
  private configCache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SecureConfigManager {
    if (!SecureConfigManager.instance) {
      SecureConfigManager.instance = new SecureConfigManager();
    }
    return SecureConfigManager.instance;
  }

  // Encrypt sensitive configuration data
  private encrypt(data: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('api-config', 'utf8'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  // Decrypt configuration data
  private decrypt(encryptedConfig: string): ProviderConfig {
    try {
      const { encrypted, iv, tag } = JSON.parse(encryptedConfig);
      const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
      const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
      decipher.setAAD(Buffer.from('api-config', 'utf8'));
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to decrypt configuration:', error);
      throw new Error('Invalid encrypted configuration data');
    }
  }

  // Store encrypted configuration
  async setConfig(provider: string, config: ProviderConfig, userId?: string, environment?: string): Promise<void> {
    const configString = JSON.stringify(config);
    const { encrypted, iv, tag } = this.encrypt(configString);
    
    const encryptedConfig = JSON.stringify({ encrypted, iv, tag });

    try {
      await prisma.apiConfiguration.upsert({
        where: { provider: provider.toUpperCase() },
        update: {
          configData: encryptedConfig,
          updatedAt: new Date(),
          version: `${Date.now()}`,
          description: `Updated configuration for ${provider}`
        },
        create: {
          provider: provider.toUpperCase(),
          configData: encryptedConfig,
          environment: environment || process.env.NODE_ENV || 'development',
          description: `Configuration for ${provider}`,
          version: `${Date.now()}`
        }
      });

      // Audit trail
      if (userId) {
        await this.logAudit('UPDATE', provider.toUpperCase(), userId);
      }
      
      // Clear cache
      this.configCache.delete(provider.toUpperCase());
      
    } catch (error) {
      console.error(`Failed to store config for ${provider}:`, error);
      throw error;
    }
  }

  // Get configuration for a specific provider
  async getConfig(provider: string, userId?: string): Promise<ProviderConfig | null> {
    const cacheKey = provider.toUpperCase();
    
    // Check cache first
    if (this.configCache.has(cacheKey)) {
      const cached = this.configCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
    }

    try {
      const config = await prisma.apiConfiguration.findFirst({
        where: { 
          provider: provider.toUpperCase(),
          isActive: true 
        }
      });

      if (!config) {
        return null;
      }

      const decryptedData = this.decrypt(config.configData);
      
      // Cache the result
      this.configCache.set(cacheKey, {
        data: decryptedData,
        timestamp: Date.now()
      });

      // Log access if userId provided
      if (userId) {
        await this.logAudit('READ', provider.toUpperCase(), userId);
      }

      return decryptedData;
    } catch (error) {
      console.error(`Error getting config for ${provider}:`, error);
      return null;
    }
  }

  // Get specific configuration value
  async getConfigValue(provider: string, key: string, userId?: string): Promise<string | null> {
    const config = await this.getConfig(provider, userId);
    return config?.[key]?.toString() || null;
  }

  // Log audit trail
  private async logAudit(action: string, provider: string, userId?: string): Promise<void> {
    try {
      // The ConfigurationAudit model stores a configurationId; use provider as identifier here
      await prisma.configurationAudit.create({
        data: {
          configurationId: provider.toUpperCase(),
          action,
          userId: userId ? String(userId) : null,
          previousValue: JSON.stringify({ 
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV 
          })
        }
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  }

  // Rotate configuration (for security)
  async rotateConfig(provider: string, newConfig: ProviderConfig, userId?: string): Promise<void> {
    // Get current config for backup
    const currentConfig = await this.getConfig(provider);
    
    if (currentConfig && userId) {
      // Store previous version in audit
      await this.logAudit('ROTATE', provider.toUpperCase(), String(userId));
    }

    await this.setConfig(provider, newConfig, userId);
  }

  // Get all active providers
  async getActiveProviders(): Promise<string[]> {
    const configs = await prisma.apiConfiguration.findMany({
      where: { isActive: true },
      select: { provider: true }
    });

    return configs.map((c: any) => c.provider);
  }

  // Deactivate a configuration
  async deactivateConfig(provider: string, userId?: string): Promise<void> {
    await prisma.apiConfiguration.update({
      where: { provider: provider.toUpperCase() },
      data: { isActive: false }
    });

    this.configCache.delete(provider.toUpperCase());
    
    if (userId) {
      await this.logAudit('DEACTIVATE', provider.toUpperCase(), String(userId));
    }
  }
}

export const secureConfig = SecureConfigManager.getInstance();

// Helper functions for common providers
export const getTwilioConfig = () => secureConfig.getConfig('twilio');
export const getStripeConfig = () => secureConfig.getConfig('stripe');
export const getGoogleOAuthConfig = () => secureConfig.getConfig('google_oauth');