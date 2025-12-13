// Define success and cancel URLs required for Stripe Checkout.
// These should point to pages in your Next.js application.

/**
 * URL for the user to be redirected to after a successful Stripe checkout.
 */
export const STRIPE_SUBSCRIPTION_SUCCESS_URL = 
  process.env.NEXT_PUBLIC_BASE_URL + '/subscription/success';

/**
 * URL for the user to be redirected to if they cancel the Stripe checkout.
 */
export const STRIPE_SUBSCRIPTION_CANCEL_URL = 
  process.env.NEXT_PUBLIC_BASE_URL + '/subscription/cancel';

// You might also add other site-wide constants here.
// e.g., export const APP_NAME = 'Web3 Social Connect';
