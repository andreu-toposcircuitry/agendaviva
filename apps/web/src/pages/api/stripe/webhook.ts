import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

// Use service key for webhook processing
const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_KEY
);

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    console.error('Webhook Error: Missing stripe-signature header');
    return new Response('Missing signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      import.meta.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${message}`);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  // Log event for debugging
  console.log(`Processing Stripe event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout session expired: ${session.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error(`Error processing webhook ${event.type}:`, error);
    // Return 500 so Stripe retries
    return new Response('Webhook processing failed', { status: 500 });
  }
};

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const paymentId = session.payment_intent as string | null;
  const subscriptionId = session.subscription as string | null;
  const stripeId = paymentId || subscriptionId;

  if (!stripeId) {
    console.warn('No payment_intent or subscription ID found in session');
    return;
  }

  // Check for duplicate processing (idempotency)
  const { data: existing } = await supabase
    .from('transaccions')
    .select('id')
    .eq('stripe_payment_id', stripeId)
    .single();

  if (existing) {
    console.log(`Transaction already processed: ${stripeId}`);
    return;
  }

  const { data, error } = await supabase
    .from('transaccions')
    .insert({
      stripe_payment_id: stripeId,
      stripe_customer_id: session.customer as string | null,
      tipus: session.metadata?.type || 'donacio',
      amount_cents: session.amount_total,
      currency: session.currency || 'eur',
      email: session.customer_email,
      entitat_id: session.metadata?.entitatId || null,
      estat: 'completada',
      metadata: {
        session_id: session.id,
        mode: session.mode,
        source: session.metadata?.source,
      },
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to insert transaction:', error);
    throw error; // Will trigger retry
  }

  console.log(`Transaction recorded: ${data.id}`);

  // If this is an entity subscription, update their status
  if (session.metadata?.type === 'quota_entitat' && session.metadata?.entitatId) {
    const { error: updateError } = await supabase
      .from('entitats')
      .update({
        verificada: true,
      })
      .eq('id', session.metadata.entitatId);

    if (updateError) {
      console.error('Failed to update entity:', updateError);
      // Don't throw - transaction was recorded, this is secondary
    }
  }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  // Find the entity with this subscription and mark as unverified
  const { data: transaction } = await supabase
    .from('transaccions')
    .select('entitat_id')
    .eq('stripe_payment_id', subscription.id)
    .single();

  if (transaction?.entitat_id) {
    await supabase
      .from('entitats')
      .update({ verificada: false })
      .eq('id', transaction.entitat_id);

    console.log(`Entity ${transaction.entitat_id} subscription cancelled`);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.warn(`Payment failed for invoice ${invoice.id}, customer: ${invoice.customer}`);

  // Could send notification email here
  // Could update entity status after grace period
}
