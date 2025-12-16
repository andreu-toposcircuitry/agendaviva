import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export async function POST({ request }: { request: Request }) {
  const { type, amount, email, entitatId } = await request.json();

  const baseAmount =
    type === 'quota_entitat' ? Number(amount ?? 15) : Number(amount ?? 0);
  const unitAmountCents = Math.round(baseAmount * 100);

  if (!unitAmountCents || unitAmountCents < 1) {
    return new Response('Invalid amount', { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: type === 'donacio' ? 'Donació Agenda Viva' : 'Quota Entitat',
          },
          unit_amount: unitAmountCents,
          ...(type === 'quota_entitat'
            ? {
                recurring: {
                  interval: 'year',
                },
              }
            : {}),
        },
        quantity: 1,
      },
    ],
    mode: type === 'quota_entitat' ? 'subscription' : 'payment',
    success_url: `${import.meta.env.PUBLIC_SITE_URL}/gracies`,
    cancel_url: `${import.meta.env.PUBLIC_SITE_URL}/donacions`,
    metadata: { type, entitatId },
    customer_email: email,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
