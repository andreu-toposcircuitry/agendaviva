import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

// Validate amount ranges
const AMOUNT_LIMITS = {
  donacio: { min: 1, max: 10000 }, // €1 to €10,000
  quota_entitat: { min: 15, max: 500 }, // €15 to €500
} as const;

type TransactionType = keyof typeof AMOUNT_LIMITS;

function isValidTransactionType(type: string): type is TransactionType {
  return type in AMOUNT_LIMITS;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { type, amount, email, entitatId } = body;

    // Validate transaction type
    if (!type || !isValidTransactionType(type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid transaction type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate amount
    const limits = AMOUNT_LIMITS[type];
    const baseAmount = type === 'quota_entitat'
      ? Number(amount ?? 15)
      : Number(amount ?? 0);

    if (isNaN(baseAmount) || baseAmount < limits.min || baseAmount > limits.max) {
      return new Response(
        JSON.stringify({
          error: `Amount must be between €${limits.min} and €${limits.max}`
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const unitAmountCents = Math.round(baseAmount * 100);

    // Generate idempotency key from request parameters
    const idempotencyKey = `checkout_${type}_${email || 'anonymous'}_${entitatId || 'none'}_${unitAmountCents}_${Date.now()}`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: type === 'donacio' ? 'Donació Agenda Viva' : 'Quota Entitat Anual',
              description: type === 'donacio'
                ? 'Gràcies pel teu suport!'
                : 'Quota anual per a entitats verificades',
            },
            unit_amount: unitAmountCents,
            ...(type === 'quota_entitat' && {
              recurring: {
                interval: 'year',
              },
            }),
          },
          quantity: 1,
        },
      ],
      mode: type === 'quota_entitat' ? 'subscription' : 'payment',
      success_url: `${import.meta.env.PUBLIC_SITE_URL}/gracies?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${import.meta.env.PUBLIC_SITE_URL}/donacions?cancelled=true`,
      metadata: {
        type,
        entitatId: entitatId || null,
        source: 'agendaviva_web',
      },
      ...(email && { customer_email: email }),
      // Collect billing address for legal compliance
      billing_address_collection: 'required',
      // Allow promotion codes
      allow_promotion_codes: true,
    };

    const session = await stripe.checkout.sessions.create(
      sessionParams,
      { idempotencyKey }
    );

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Stripe checkout error:', error);

    const message = error instanceof Stripe.errors.StripeError
      ? error.message
      : 'An error occurred creating the checkout session';

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
