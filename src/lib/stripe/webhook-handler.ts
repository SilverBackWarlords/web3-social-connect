import { Stripe } from 'stripe';
import { SubscriptionType } from './stripe-actions'; 
// CRITICAL FIX: Changed from '@/lib/firebase/firebase-actions' to the file we modified:
import { updateSubscriptionStatus } from '@/lib/firebase/admin'; 

// Map of Stripe Price IDs to our internal SubscriptionType
const productPriceToSubscriptionType: { [key: string]: SubscriptionType } = {
  // Map your Basic Web3 Subscription Price ID here
  'price_1SdlhZA8WGEzwz9iQIOyMr1X': 'BASIC', 
  // Add other tiers if necessary
};

// --- Individual Handlers ---

export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id;
  const subscriptionType = priceId ? productPriceToSubscriptionType[priceId] : undefined;

  if (subscriptionType) {
    await updateSubscriptionStatus({
      userId: subscription.metadata.firebaseUserId,
      status: subscription.status as any,
      type: subscriptionType,
      currentPeriodEnd: subscription.current_period_end,
    });
  }
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id;
  const subscriptionType = priceId ? productPriceToSubscriptionType[priceId] : undefined;

  if (subscriptionType) {
    await updateSubscriptionStatus({
      userId: subscription.metadata.firebaseUserId,
      status: subscription.status as any,
      type: subscriptionType,
      currentPeriodEnd: subscription.current_period_end,
    });
  }
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await updateSubscriptionStatus({
    userId: subscription.metadata.firebaseUserId,
    status: subscription.status as any, 
    type: 'FREE', 
    currentPeriodEnd: subscription.current_period_end,
  });
}

export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const firebaseUserId = session.metadata?.firebaseUserId;
  const priceId = session.line_items?.data[0]?.price?.id;

  if (!firebaseUserId) {
    throw new Error('Checkout session missing firebaseUserId metadata.');
  }

  if (session.mode === 'subscription' && session.subscription && priceId) {
    const subscriptionType = productPriceToSubscriptionType[priceId];

    if (subscriptionType) {
      await updateSubscriptionStatus({
        userId: firebaseUserId,
        status: 'pending', 
        type: subscriptionType,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
      });
    }
    return;
  }

  if (session.mode === 'payment' && session.payment_status === 'paid') {
    console.log(`One-time payment completed for user ${firebaseUserId}. Session ID: ${session.id}`);
    return;
  }
}

export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string | null;
  const customerId = invoice.customer as string | null;

  if (subscriptionId) {
    console.log(`Subscription ${subscriptionId} payment successful.`);
  } else if (customerId) {
    console.log(`Invoice payment successful for customer ${customerId}.`);
  }
}

// --- REQUIRED EXPORT: The Main Wrapper Function ---

export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.created':
      const subscriptionCreated = event.data.object as Stripe.Subscription;
      await handleSubscriptionCreated(subscriptionCreated);
      break;

    case 'customer.subscription.updated':
      const subscriptionUpdated = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscriptionUpdated);
      break;

    case 'customer.subscription.deleted':
      const subscriptionDeleted = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscriptionDeleted);
      break;

    case 'checkout.session.completed':
      const sessionCompleted = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionCompleted(sessionCompleted);
      break;
      
    case 'invoice.payment_succeeded':
      const invoiceSucceeded = event.data.object as Stripe.Invoice;
      await handleInvoicePaymentSucceeded(invoiceSucceeded);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }
}