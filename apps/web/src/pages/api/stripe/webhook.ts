import Stripe from 'stripe';
import { supabase } from '../../lib/supabase-server';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export async function POST({ request }: { request: Request }) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return new Response('Missing signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, import.meta.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    await supabase.from('transaccions').insert({
      stripe_payment_id: session.payment_intent as string,
      tipus: session.metadata?.type,
      amount_cents: session.amount_total,
      email: session.customer_email,
      entitat_id: session.metadata?.entitatId,
    });
  }

  return new Response('OK');
}
