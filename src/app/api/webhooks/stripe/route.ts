import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

/**
 * Stripe webhook: marks an order as paid once Checkout confirms the payment.
 *
 * Configure the endpoint in the Stripe dashboard and set STRIPE_WEBHOOK_SECRET
 * in the environment file.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json(
      { error: "Stripe webhooks are not configured." },
      { status: 501 },
    );
  }

  const signature = (await headers()).get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const payload = await request.text();

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, secret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderNumber = session.metadata?.orderNumber;
      if (orderNumber) {
        await prisma.order.update({
          where: { number: orderNumber },
          data: {
            status: "PAID",
            paymentRef: session.payment_intent as string,
            paymentMethod: "stripe",
          },
        });
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      const orderNumber = session.metadata?.orderNumber;
      if (orderNumber) {
        await prisma.order.update({
          where: { number: orderNumber },
          data: { status: "CANCELLED" },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("stripe webhook error", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }
}
