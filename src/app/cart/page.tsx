import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Truck } from "lucide-react";
import { calculateTotals, getCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { CartLineItem } from "@/components/cart-line-item";
import { CouponForm } from "@/components/coupon-form";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review the items in your ShopFront cart before checkout.",
};

export default async function CartPage() {
  const cart = await getCart();
  const totals = await calculateTotals(cart);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-ink-100 text-ink-400">
          <ShoppingBag className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-black tracking-tight text-ink-950">
          Your cart is empty
        </h1>
        <p className="max-w-md text-sm text-ink-500">
          Nothing here yet. Browse the catalogue and add something you love —
          new shoppers can use code <strong>WELCOME10</strong> for 10% off.
        </p>
        <Link href="/products" className="btn btn-primary mt-2">
          Start shopping
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const amountToFreeShipping = 15000 - totals.subtotal;

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-black tracking-tight text-ink-950">Your cart</h1>
      <p className="mt-1 text-sm text-ink-500">
        {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"} reserved
        for 60 minutes.
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

          <div className="mt-5 border-t border-ink-100 pt-5">
            <p className="label">Promo code</p>
            <CouponForm
              applied={totals.couponCode}
              error={totals.couponError}
            />
          </div>

          <div className="mt-5 flex justify-between">
            <Link
              href="/products"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              ← Continue shopping
            </Link>
          </div>
        </div>

        <div className="lg:sticky lg:top-32 lg:self-start">
          <div className="card p-5">
            <h2 className="text-sm font-bold text-ink-900">Order summary</h2>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-ink-600">
                <dt>Subtotal</dt>
                <dd className="font-semibold text-ink-900">
                  {formatMoney(totals.subtotal)}
                </dd>
              </div>
              {totals.discount > 0 ? (
                <div className="flex justify-between text-emerald-600">
                  <dt>Discount</dt>
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
                <dt>Estimated tax</dt>
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

            <Link href="/checkout" className="btn btn-primary mt-5 w-full py-3">
              Checkout
              <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-ink-400">
              <Truck className="h-3.5 w-3.5" />
              {amountToFreeShipping > 0
                ? `Add ${formatMoney(amountToFreeShipping)} for free shipping`
                : "Your order ships free"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
