import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Lock, PackageCheck } from "lucide-react";
import { calculateTotals, getCart } from "@/lib/cart";
import { getSession } from "@/lib/session";
import { isStripeEnabled } from "@/lib/stripe";
import { formatMoney } from "@/lib/format";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your ShopFront order.",
};

export default async function CheckoutPage() {
  const [cart, session] = await Promise.all([getCart(), getSession()]);
  if (!cart || cart.items.length === 0) redirect("/cart");

  const totals = await calculateTotals(cart);

  return (
    <div className="container-page py-10">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link href="/cart" className="hover:text-brand-600">
          Cart
        </Link>
        <span>/</span>
        <span className="text-ink-800">Checkout</span>
      </div>

      <h1 className="mt-3 text-3xl font-black tracking-tight text-ink-950">
        Checkout
      </h1>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
        <Lock className="h-3.5 w-3.5" /> Secure, encrypted payment
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <CheckoutForm
          defaultEmail={session?.email ?? ""}
          defaultName={session?.name ?? ""}
          total={totals.total}
          stripeEnabled={isStripeEnabled()}
        />

        <div className="lg:sticky lg:top-32 lg:self-start">
          <div className="card p-5">
            <h2 className="text-sm font-bold text-ink-900">
              Order summary ({totals.itemCount})
            </h2>

            <ul className="mt-4 space-y-3">
              {cart.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-ink-500">
                      Qty {item.quantity} × {formatMoney(item.product.price)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink-900">
                    {formatMoney(item.product.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2.5 border-t border-ink-100 pt-4 text-sm">
              <div className="flex justify-between text-ink-600">
                <dt>Subtotal</dt>
                <dd className="font-semibold text-ink-900">
                  {formatMoney(totals.subtotal)}
                </dd>
              </div>
              {totals.discount > 0 ? (
                <div className="flex justify-between text-emerald-600">
                  <dt>Discount ({totals.couponCode})</dt>
                  <dd className="font-semibold">
                    −{formatMoney(totals.discount)}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between text-ink-600">
                <dt>Shipping</dt>
                <dd className="font-semibold text-ink-900">
                  {totals.shipping === 0 ? "Free" : formatMoney(totals.shipping)}
                </dd>
              </div>
              <div className="flex justify-between text-ink-600">
                <dt>Tax</dt>
                <dd className="font-semibold text-ink-900">
                  {formatMoney(totals.tax)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-ink-100 pt-3 text-base">
                <dt className="font-bold text-ink-900">Total</dt>
                <dd className="font-black text-ink-950">
                  {formatMoney(totals.total)}
                </dd>
              </div>
            </dl>

            <p className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-[11px] leading-relaxed text-emerald-800">
              <PackageCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Orders placed before 4pm ship the same working day with tracked
              delivery.
            </p>

            <Link
              href="/products"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-ink-900"
            >
              Continue shopping <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
