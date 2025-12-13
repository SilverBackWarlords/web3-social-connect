// Code to paste into nano:
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleStripeEvent } from '@/lib/stripe/webhook-handler'; 
import { Readable } from 'stream';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

async function buffer(readable: NextRequest): Promise<Buffer> {
  const chunks = [];
  for await (const chunk of readable as any) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export const dynamic = 'force-dynamic'; 

export async function POST(req: NextRequest) {
  const buf = await buffer(req);
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error('⚠️ Missing Stripe signature or webhook secret.');
    return new NextResponse('Missing signature or secret', { status: 400 });
  }

  let event: Stripe.Event;
  
  // This step verifies that the request truly came from Stripe 
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

  try {
    await handleStripeEvent(event, stripe);
  } catch (error) {
    console.error(`⚠️ Webhook event processing failed: ${error}`);
    return new NextResponse(`Webhook Handler Error: ${error}`, { status: 500 });
  }

  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}
