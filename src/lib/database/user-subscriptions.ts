// Code to paste into nano:
import { db } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';

export type SubscriptionTier = 'FREE' | 'BASIC' | 'FLEXIBLE_PAY';
export type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'past_due' | 'free';

export async function updateUserSubscription(
  userId: string,
  status: SubscriptionStatus,
  tier: SubscriptionTier
): Promise<void> {
  const userRef = db.collection('users').doc(userId);

  await userRef.set({
    subscription: {
      status: status,
      tier: tier,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(), 
    },
    isPremium: tier !== 'FREE', 
  }, { merge: true });
  
  console.log(`[Firestore] User ${userId} updated. Status: ${status}, Tier: ${tier}`);
}

export async function handleOneTimePayment(
  userId: string, 
  amountPaidCents: number
): Promise<void> {
    const paymentRef = db.collection('payments').doc();
    
    await paymentRef.set({
        userId: userId,
        amountCents: amountPaidCents,
        solanaActionStatus: 'PENDING_MINT', 
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`[Firestore] One-time payment recorded for ${userId}. Amount: ${amountPaidCents/100} USD. Minting process initiated...`);
}
