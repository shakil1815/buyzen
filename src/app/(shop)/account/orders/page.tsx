import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDate, formatMoney } from "@/lib/format";
import { getDateLocale, getT } from "@/lib/i18n/server";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";

export const metadata: Metadata = {
  title: "My orders",
  description: "Track and review your ShopFront orders.",
};

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-brand-soft text-brand-fg",
  PROCESSING: "bg-warn-soft text-warn-fg",
  SHIPPED: "bg-info-soft text-info-fg",
  DELIVERED: "bg-success-soft text-success-fg",
  CANCELLED: "bg-danger-soft text-danger-fg",
  PENDING: "bg-surface-3 text-fg-muted",
};

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/orders");

  const [t, currency, dateLocale] = await Promise.all([
    getT(),
    getCurrency(),
    getDateLocale(),
  ]);
  const rate = usdToBdtRate();
  const money = (cents: number) => formatMoney(cents, currency, rate);

  const orders = await prisma.order.findMany({
    where: { userId: session.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-black tracking-tight text-fg-strong">
        {t("account.ordersTitle")}
      </h1>
      <p className="mt-1 text-sm text-fg-muted">
        {t("account.ordersCount", { count: orders.length })}
      </p>

      {orders.length === 0 ? (
        <div className="card mt-8 flex flex-col items-center gap-3 py-20 text-center">
          <Package className="h-9 w-9 text-fg-subtle" />
          <h2 className="text-lg font-bold text-fg">
            {t("account.noOrdersTitle")}
          </h2>
          <p className="max-w-sm text-sm text-fg-muted">
            {t("account.noOrdersBody")}
          </p>
          <Link href="/products" className="btn btn-primary mt-1">
            {t("cart.startShopping")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <p className="text-sm font-semibold text-fg">
                    {order.number}
                  </p>
                  <p className="text-xs text-fg-muted">
                    Placed {formatDate(order.createdAt, dateLocale)} ·{" "}
                    {order.paymentMethod ?? "card"}
                    {order.paymentRef ? ` · ${order.paymentRef}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`badge ${STATUS_STYLES[order.status] ?? "bg-surface-3 text-fg-muted"}`}
                  >
                    {order.status}
                  </span>
                  <span className="text-base font-black text-fg-strong">
                    {money(order.total)}
                  </span>
                </div>
              </div>

              <ul className="divide-y divide-line">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 py-4">
                    <Link
                      href={`/products/${item.slug}`}
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2"
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${item.slug}`}
                        className="text-sm font-medium text-fg hover:text-brand-fg"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-fg-muted">
                        {t("account.items", { count: item.quantity })} ×{" "}
                        {money(item.price)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-fg">
                      {money(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-fg-muted">
                <span>
                  {t("account.shippingTo", {
                    name: order.shippingName,
                    city: order.city,
                    postal: order.postalCode,
                  })}
                </span>
                <span>
                  {t("cart.subtotal")} {money(order.subtotal)}
                  {order.discount > 0
                    ? ` · ${t("cart.discount")} −${money(order.discount)}`
                    : ""}
                  {order.couponCode ? ` (${order.couponCode})` : ""} ·{" "}
                  {t("cart.tax")} {money(order.tax)} · {t("cart.shipping")}{" "}
                  {order.shipping === 0 ? t("cart.free") : money(order.shipping)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
