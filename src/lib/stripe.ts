import Stripe from 'stripe'
import { getStripeConfig } from './config-helper'

// Initialize Stripe - will be set up properly when config is loaded
let stripe: Stripe | null = null;

// Function to get or create Stripe instance
export async function getStripe(): Promise<Stripe> {
  if (stripe) {
    return stripe;
  }

  const config = await getStripeConfig();
  if (!config?.secretKey) {
    throw new Error('Stripe configuration not found. Please configure Stripe in the admin dashboard.');
  }

  stripe = new Stripe(config.secretKey, {
    apiVersion: '2025-09-30.clover',
  });

  return stripe;
}

// Export config helper
export { getStripeConfig } from './config-helper';

// For backward compatibility - deprecated, use getStripe() instead
export { stripe } from './stripe-legacy';

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
