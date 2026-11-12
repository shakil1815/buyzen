import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Lock, PackageCheck } from "lucide-react";
import { calculateTotals, getCart } from "@/lib/cart";
import { getSession } from "@/lib/session";
import { isStripeEnabled } from "@/lib/stripe";
import { formatMoney } from "@/lib/format";
import { CheckoutForm } from "@/components/checkout-form";
import { getT } from "@/lib/i18n/server";
import { usdToBdtRate } from "@/lib/currency";
import { getCurrency } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your BuyZen order.",
};

export default async function CheckoutPage() {
  const [cart, session, t, currency] = await Promise.all([
    getCart(),
    getSession(),
    getT(),
    getCurrency(),
  ]);
  if (!cart || cart.items.length === 0) redirect("/cart");

  const totals = await calculateTotals(cart);
  const rate = usdToBdtRate();
  const money = (cents: number) => formatMoney(cents, currency, rate);

  return (
    <div className="container-page py-10">
      <div className="flex items-center gap-2 text-xs text-fg-muted">
        <Link href="/cart" className="hover:text-brand-fg">
          {t("nav.cart")}
        </Link>
        <span>/</span>
        <span className="text-fg">{t("checkout.title")}</span>
      </div>

      <h1 className="mt-3 text-3xl font-black tracking-tight text-fg-strong">
        {t("checkout.title")}
      </h1>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-fg-muted">
        <Lock className="h-3.5 w-3.5" /> {t("checkout.secure")}
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
            <h2 className="text-sm font-bold text-fg">
              Order summary ({totals.itemCount})
            </h2>

            <ul className="mt-4 space-y-3">
              {cart.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-fg-muted">
                      {t("account.items", { count: item.quantity })} ×{" "}
                      {money(item.product.price)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-fg">
                    {money(item.product.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between text-fg-muted">
                <dt>{t("cart.subtotal")}</dt>
                <dd className="font-semibold text-fg">{money(totals.subtotal)}</dd>
              </div>
              {totals.discount > 0 ? (
                <div className="flex justify-between text-success-fg">
                  <dt>
                    {t("cart.discount")} ({totals.couponCode})
                  </dt>
                  <dd className="font-semibold">−{money(totals.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between text-fg-muted">
                <dt>{t("cart.shipping")}</dt>
                <dd className="font-semibold text-fg">
                  {totals.shipping === 0 ? t("cart.free") : money(totals.shipping)}
                </dd>
              </div>
              <div className="flex justify-between text-fg-muted">
                <dt>{t("cart.tax")}</dt>
                <dd className="font-semibold text-fg">{money(totals.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-bold text-fg">{t("cart.total")}</dt>
                <dd className="font-black text-fg-strong">{money(totals.total)}</dd>
              </div>
            </dl>

            <p className="mt-4 flex items-start gap-2 rounded-xl bg-success-soft p-3 text-[11px] leading-relaxed text-success-fg">
              <PackageCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {t("success.packedBody")}
            </p>

            <Link
              href="/products"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-fg-muted hover:text-fg"
            >
              {t("cart.continueShopping")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
