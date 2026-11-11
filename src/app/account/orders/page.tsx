import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "My orders",
  description: "Track and review your ShopFront orders.",
};

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-brand-50 text-brand-700",
  PROCESSING: "bg-amber-50 text-amber-700",
  SHIPPED: "bg-sky-50 text-sky-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700",
  PENDING: "bg-ink-100 text-ink-700",
};

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/orders");

  const orders = await prisma.order.findMany({
    where: { userId: session.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-black tracking-tight text-ink-950">
        My orders
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        {orders.length} {orders.length === 1 ? "order" : "orders"} placed.
      </p>

      {orders.length === 0 ? (
        <div className="card mt-8 flex flex-col items-center gap-3 py-20 text-center">
          <Package className="h-9 w-9 text-ink-300" />
          <h2 className="text-lg font-bold text-ink-900">No orders yet</h2>
          <p className="max-w-sm text-sm text-ink-500">
            When you place an order it will appear here with live tracking.
          </p>
          <Link href="/products" className="btn btn-primary mt-1">
            Browse the catalogue
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-4">
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    {order.number}
                  </p>
                  <p className="text-xs text-ink-500">
                    Placed {formatDate(order.createdAt)} ·{" "}
                    {order.paymentMethod ?? "card"}
                    {order.paymentRef ? ` · ${order.paymentRef}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`badge ${STATUS_STYLES[order.status] ?? "bg-ink-100 text-ink-700"}`}
                  >
                    {order.status}
                  </span>
                  <span className="text-base font-black text-ink-950">
                    {formatMoney(order.total)}
                  </span>
                </div>
              </div>

              <ul className="divide-y divide-ink-100">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 py-4">
                    <Link
                      href={`/products/${item.slug}`}
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-50"
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
                        className="text-sm font-medium text-ink-900 hover:text-brand-600"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-ink-500">
                        Qty {item.quantity} × {formatMoney(item.price)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-ink-900">
                      {formatMoney(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4 text-xs text-ink-500">
                <span>
                  Shipping to {order.shippingName}, {order.city} {order.postalCode}
                </span>
                <span>
                  Subtotal {formatMoney(order.subtotal)}
                  {order.discount > 0
                    ? ` · Discount −${formatMoney(order.discount)}`
                    : ""}
                  {order.couponCode ? ` (${order.couponCode})` : ""} · Tax{" "}
                  {formatMoney(order.tax)} · Shipping{" "}
                  {order.shipping === 0 ? "Free" : formatMoney(order.shipping)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
