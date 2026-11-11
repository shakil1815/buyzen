"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { calculateTotals, clearCart, getCart } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import { maskCard, validateCard } from "@/lib/payment";
import { getSession } from "@/lib/session";
import { getStripe } from "@/lib/stripe";

export type CheckoutState = { error?: string };

const checkoutSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  shippingName: z.string().min(2, "Enter the recipient name"),
  address1: z.string().min(4, "Enter a street address"),
  address2: z.string().optional(),
  city: z.string().min(2, "Enter a city"),
  state: z.string().optional(),
  postalCode: z.string().min(3, "Enter a postal code"),
  country: z.string().min(2, "Select a country"),
  phone: z.string().optional(),
  cardNumber: z.string().min(12, "Enter a card number"),
  expiry: z.string().min(4, "Enter the expiry date"),
  cvc: z.string().min(3, "Enter the CVC"),
});

const addressSchema = checkoutSchema.omit({
  cardNumber: true,
  expiry: true,
  cvc: true,
});

type Customer = {
  email: string;
  shippingName: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  userId: string | null;
};

async function loadCustomer(formData: FormData): Promise<Customer | string> {
  const parsed = addressSchema.safeParse({
    email: formData.get("email"),
    shippingName: formData.get("shippingName"),
    address1: formData.get("address1"),
    address2: formData.get("address2") ?? "",
    city: formData.get("city"),
    state: formData.get("state") ?? "",
    postalCode: formData.get("postalCode"),
    country: formData.get("country"),
    phone: formData.get("phone") ?? "",
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Check your details.";
  }

  const user = await getSession();
  return { ...parsed.data, userId: user?.id ?? null };
}

async function createOrder(
  cart: NonNullable<Awaited<ReturnType<typeof getCart>>>,
  totals: Awaited<ReturnType<typeof calculateTotals>>,
  customer: Customer,
  options: { status: string; paymentMethod: string; paymentRef?: string | null },
) {
  const orderNumber = `SF-${Date.now().toString(36).toUpperCase()}-${Math.floor(
    Math.random() * 900 + 100,
  )}`;

  return prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        number: orderNumber,
        userId: customer.userId,
        email: customer.email.toLowerCase(),
        shippingName: customer.shippingName,
        address1: customer.address1,
        address2: customer.address2 || null,
        city: customer.city,
        state: customer.state || null,
        postalCode: customer.postalCode,
        country: customer.country,
        phone: customer.phone || null,
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        tax: totals.tax,
        total: totals.total,
        couponCode: totals.couponCode,
        status: options.status,
        paymentMethod: options.paymentMethod,
        paymentRef: options.paymentRef ?? null,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            name: item.product.name,
            slug: item.product.slug,
            image: item.product.image,
            price: item.product.price,
            quantity: item.quantity,
          })),
        },
      },
    });

    if (options.status === "PAID") {
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      if (totals.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: totals.couponCode },
        });
        if (coupon) {
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }
    }

    return created;
  });
}

export async function placeOrderAction(
  _state: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse({
    email: formData.get("email"),
    shippingName: formData.get("shippingName"),
    address1: formData.get("address1"),
    address2: formData.get("address2") ?? "",
    city: formData.get("city"),
    state: formData.get("state") ?? "",
    postalCode: formData.get("postalCode"),
    country: formData.get("country"),
    phone: formData.get("phone") ?? "",
    cardNumber: formData.get("cardNumber"),
    expiry: formData.get("expiry"),
    cvc: formData.get("cvc"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const card = validateCard(
    parsed.data.cardNumber,
    parsed.data.expiry,
    parsed.data.cvc,
  );
  if (!card.valid) {
    return { error: card.error ?? "Payment could not be verified." };
  }

  const cart = await getCart();
  if (!cart || cart.items.length === 0) {
    return { error: "Your cart is empty." };
  }

  const totals = await calculateTotals(cart);

  for (const item of cart.items) {
    if (item.quantity > item.product.stock) {
      return {
        error: `${item.product.name} only has ${item.product.stock} left in stock.`,
      };
    }
  }

  const order = await createOrder(
    cart,
    totals,
    {
      email: parsed.data.email,
      shippingName: parsed.data.shippingName,
      address1: parsed.data.address1,
      address2: parsed.data.address2,
      city: parsed.data.city,
      state: parsed.data.state,
      postalCode: parsed.data.postalCode,
      country: parsed.data.country,
      phone: parsed.data.phone,
      userId: (await getSession())?.id ?? null,
    },
    {
      status: "PAID",
      paymentMethod: `card (${card.brand ?? "card"})`,
      paymentRef: `pi_${Math.random().toString(36).slice(2, 12)}`,
    },
  );

  await clearCart();
  revalidatePath("/cart");
  redirect(
    `/checkout/success?order=${order.number}&card=${encodeURIComponent(
      maskCard(parsed.data.cardNumber),
    )}`,
  );
}

/**
 * Alternative checkout that hands the payment over to Stripe Checkout.
 * Only active when STRIPE_SECRET_KEY is configured.
 */
export async function startStripeCheckout(formData: FormData) {
  const stripe = getStripe();
  if (!stripe) return;

  const customer = await loadCustomer(formData);
  if (typeof customer === "string") return;

  const cart = await getCart();
  if (!cart || cart.items.length === 0) return;

  const totals = await calculateTotals(cart);

  const order = await createOrder(cart, totals, customer, {
    status: "PENDING",
    paymentMethod: "stripe",
  });

  const lineItems: Array<Record<string, unknown>> = cart.items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: "usd",
      unit_amount: item.product.price,
      product_data: {
        name: item.product.name,
        images: [`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}${item.product.image}`],
      },
    },
  }));

  if (totals.tax > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: totals.tax,
        product_data: { name: "Estimated tax" },
      },
    });
  }

  const discounts: Array<Record<string, unknown>> = [];
  if (totals.discount > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: totals.discount,
      currency: "usd",
      name: totals.couponCode ?? "Promotion",
    });
    discounts.push({ coupon: coupon.id });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    discounts,
    customer_email: customer.email,
    shipping_options:
      totals.shipping > 0
        ? [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: { amount: totals.shipping, currency: "usd" },
                display_name: "Standard shipping",
                delivery_estimate: {
                  minimum: { unit: "business_day", value: 2 },
                  maximum: { unit: "business_day", value: 5 },
                },
              },
            },
          ]
        : undefined,
    metadata: { orderNumber: order.number },
    success_url: `${origin}/checkout/success?order=${order.number}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout`,
  });

  if (session.url) redirect(session.url);
}
