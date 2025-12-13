import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  // Initialization requires proper environment variables for service account
  admin.initializeApp({});
}

const db = admin.firestore();

// Type definition for the subscription update data (assuming a UserSubscription type elsewhere)
interface SubscriptionUpdateData {
  userId: string;
  status: 'active' | 'pending' | 'canceled' | 'trialing' | 'free';
  type: 'BASIC' | 'PRO' | 'FREE';
  currentPeriodEnd?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

/**
 * Updates the subscription status for a user in Firestore.
 * This is the function required by the webhook-handler.ts file.
 */
export async function updateSubscriptionStatus(data: SubscriptionUpdateData) {
  const userRef = db.collection('users').doc(data.userId);
  const subscriptionData: any = {
    subscriptionStatus: data.status,
    subscriptionType: data.type,
    // Convert seconds to Firestore Timestamp
    currentPeriodEnd: data.currentPeriodEnd 
      ? admin.firestore.Timestamp.fromMillis(data.currentPeriodEnd * 1000) 
      : null,
  };

  if (data.stripeCustomerId) {
    subscriptionData.stripeCustomerId = data.stripeCustomerId;
  }
  if (data.stripeSubscriptionId) {
    subscriptionData.stripeSubscriptionId = data.stripeSubscriptionId;
  }

  try {
    await userRef.set(subscriptionData, { merge: true });
    console.log(`User ${data.userId} subscription updated to ${data.status} (${data.type})`);
  } catch (error) {
    console.error(`Error updating subscription for user ${data.userId}:`, error);
    throw new Error('Failed to update user subscription status in Firestore.');
  }
}


export { db }; // Exporting db for other uses