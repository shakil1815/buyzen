import Stripe from "stripe";

let client: Stripe | null = null;

/** Returns a Stripe client when the secret key is configured, otherwise null. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) client = new Stripe(key);
  return client;
}

export function isStripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
