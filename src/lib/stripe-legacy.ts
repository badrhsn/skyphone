// Legacy Stripe configuration - fallback to environment variables
// This file provides backward compatibility while transitioning to secure config

import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover',
});