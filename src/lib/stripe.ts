import { getStripeConfig } from './config-helper'
import { isBuildTime } from './build-guard'

// Initialize Stripe - will be set up properly when config is loaded
// Use 'any' here to avoid referencing Stripe type before dynamic import
let stripe: any | null = null;

// Function to get or create Stripe instance
export async function getStripe(): Promise<any> {
  if (stripe) {
    return stripe;
  }

  // Avoid initializing Stripe during build/compile time
  if (isBuildTime()) {
    // Return a lightweight proxy that throws only if actually used at build
    return new Proxy({}, {
      get() {
        throw new Error('Stripe SDK is not available during build');
      }
    });
  }

  const config = await getStripeConfig();
  if (!config?.secretKey) {
    throw new Error('Stripe configuration not found. Please configure Stripe in the admin dashboard.');
  }

  const { default: Stripe } = await import('stripe');
  stripe = new Stripe(config.secretKey, {
    apiVersion: '2025-09-30.clover',
  });

  return stripe;
}

// Export config helper
export { getStripeConfig } from './config-helper';

export const formatAmountForStripe = (amount: number, currency: string): number => {
  const numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  })
  const parts = numberFormat.formatToParts(amount)
  let zeroDecimalCurrency = true
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false
    }
  }
  return zeroDecimalCurrency ? amount : Math.round(amount * 100)
}

export const formatAmountFromStripe = (amount: number, currency: string): number => {
  const numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  })
  const parts = numberFormat.formatToParts(100)
  let zeroDecimalCurrency = true
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false
    }
  }
  return zeroDecimalCurrency ? amount : amount / 100
}
