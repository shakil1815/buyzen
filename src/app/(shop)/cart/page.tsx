import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Truck } from "lucide-react";
import { calculateTotals, getCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { CartLineItem } from "@/components/cart-line-item";
import { CouponForm } from "@/components/coupon-form";
import { getT } from "@/lib/i18n/server";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review the items in your BuyZen cart before checkout.",
};

export default async function CartPage() {
  const [cart, t, currency] = await Promise.all([
    getCart(),
    getT(),
    getCurrency(),
  ]);
  const rate = usdToBdtRate();
  const totals = await calculateTotals(cart);
  const money = (cents: number) => formatMoney(cents, currency, rate);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-3 text-fg-subtle">
          <ShoppingBag className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-black tracking-tight text-fg-strong">
          {t("cart.empty.title")}
        </h1>
        <p className="max-w-md text-sm text-fg-muted">
          {t("cart.empty.body", { code: "WELCOME10" })}
        </p>
        <Link href="/products" className="btn btn-primary mt-2">
          {t("cart.startShopping")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const amountToFreeShipping = 15000 - totals.subtotal;

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-black tracking-tight text-fg-strong">
        {t("cart.title")}
      </h1>
      <p className="mt-1 text-sm text-fg-muted">
        {t("cart.reserved", { count: totals.itemCount })}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="card p-5">
          <div>
            {cart.items.map((item) => (
              <CartLineItem
                key={item.id}
                item={{
                  id: item.id,
                  quantity: item.quantity,
                  product: item.product,
                }}
              />
            ))}
          </div>

          <div className="mt-5 border-t border-line pt-5">
            <p className="label">{t("cart.promoCode")}</p>
            <CouponForm
              applied={totals.couponCode}
              error={totals.couponError}
            />
          </div>

          <div className="mt-5 flex justify-between">
            <Link
              href="/products"
              className="text-sm font-semibold text-brand-fg hover:text-brand-600"
            >
              ← {t("cart.continueShopping")}
            </Link>
          </div>
        </div>

        <div className="lg:sticky lg:top-32 lg:self-start">
          <div className="card p-5">
            <h2 className="text-sm font-bold text-fg">{t("cart.summary")}</h2>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-fg-muted">
                <dt>{t("cart.subtotal")}</dt>
                <dd className="font-semibold text-fg">{money(totals.subtotal)}</dd>
              </div>
              {totals.discount > 0 ? (
                <div className="flex justify-between text-success-fg">
                  <dt>{t("cart.discount")}</dt>
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

            <Link href="/checkout" className="btn btn-primary mt-5 w-full py-3">
              {t("cart.checkout")}
              <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-fg-subtle">
              <Truck className="h-3.5 w-3.5" />
              {amountToFreeShipping > 0
                ? t("cart.freeShippingProgress", { amount: money(amountToFreeShipping) })
                : t("cart.freeShippingDone")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
