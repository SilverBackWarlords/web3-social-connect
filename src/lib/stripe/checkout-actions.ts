import { loadStripe } from '@stripe/stripe-js';
// FIX: Changed relative path './user-actions' to use the alias, 
// assuming the file is at src/lib/user-actions.ts
import { getCurrentUser } from '@/lib/user-actions'; 
import { STRIPE_SUBSCRIPTION_SUCCESS_URL, STRIPE_SUBSCRIPTION_CANCEL_URL } from '@/lib/constants';

// The Price ID for the basic /month Web3 Subscription plan
const BASIC_PLAN_PRICE_ID = 'price_1SdlhZA8WGEzwz9iQIOyMr1X';

// Use your publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Function to handle checkout for the basic subscription
export async function handleCheckoutBasicSubscription() {
  // Assume getCurrentUser returns a user object or null/undefined
  const user = await getCurrentUser();

  if (!user || !user.email) {
    throw new Error('User not logged in or email not found.');
  }

  const stripe = await stripePromise;
  if (!stripe) {
    throw new Error('Failed to load Stripe.');
  }

  // Create a checkout session
  const session = await stripe.redirectToCheckout({
    mode: 'subscription',
    lineItems: [{ price: BASIC_PLAN_PRICE_ID, quantity: 1 }],
    // Passing required metadata for webhook processing
    customerEmail: user.email,
    successUrl: STRIPE_SUBSCRIPTION_SUCCESS_URL,
    cancelUrl: STRIPE_SUBSCRIPTION_CANCEL_URL,
    // Note: You might need to add metadata for firebaseUserId here if the customer is not yet registered in Stripe.
    // metadata: { firebaseUserId: user.id }
  });

  if (session.error) {
    console.error('Stripe Checkout Error:', session.error.message);
    throw new Error(`Checkout failed: ${session.error.message}`);
  }
}