import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
// FIX: Using alias, as tsconfig.json is now correct
import { handleStripeEvent } from '@/lib/stripe/webhook-handler'; 
import { Readable } from 'stream';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Using the latest confirmed stable API version
  apiVersion: '2024-06-20', 
  typescript: true,
});

async function buffer(readable: NextRequest): Promise<Buffer> {
  const chunks = [];
  // Correctly handling the async iteration over the request body
  for await (const chunk of readable as any) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Ensures the API route is treated as a dynamic request
export const dynamic = 'force-dynamic'; 

export async function POST(req: NextRequest) {
  // Read the raw body stream
  const buf = await buffer(req);
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error('⚠️ Missing Stripe signature or webhook secret.');
    return new NextResponse('Missing signature or secret', { status: 400 });
  }

  let event: Stripe.Event;
  
  // Verify the request using the raw body and signature
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      signature,
      webhookSecret
    );
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Pass the verified event to the handler logic
  try {
    await handleStripeEvent(event); 
  } catch (error) {
    console.error(`⚠️ Webhook event processing failed: ${error}`);
    return new NextResponse(`Webhook Handler Error: ${error}`, { status: 500 });
  }

  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}