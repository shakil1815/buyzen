import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Package, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";
import { OrderStatusSelect } from "@/components/order-status-select";

export const metadata: Metadata = {
  title: "Order detail",
};

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-brand-soft text-brand-fg",
  PROCESSING: "bg-warn-soft text-warn-fg",
  SHIPPED: "bg-info-soft text-info-fg",
  DELIVERED: "bg-success-soft text-success-fg",
  CANCELLED: "bg-danger-soft text-danger-fg",
  PENDING: "bg-surface-3 text-fg-muted",
};

export default async function AdminOrderDetailPage(
  props: PageProps<"/admin/orders/[id]">,
) {
  const { id } = await props.params;

  const [order, t, currency] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: { items: true, user: { select: { name: true, email: true } } },
    }),
    getT(),
    getCurrency(),
  ]);

  if (!order) notFound();

  const rate = usdToBdtRate();
  const money = (cents: number) => formatMoney(cents, currency, rate);

  return (
    <div>
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm font-semibold text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> {t("admin.backToOrders")}
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-fg-strong">
            {order.number}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {formatDate(order.createdAt, "en-US")} · {order.paymentMethod}
            {order.paymentRef ? ` · ${order.paymentRef}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`badge ${STATUS_STYLES[order.status] ?? "bg-surface-3 text-fg-muted"}`}
          >
            {order.status}
          </span>
          <OrderStatusSelect orderId={order.id} status={order.status} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="text-sm font-bold text-fg">{t("admin.items")}</h2>
            <ul className="mt-4 divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3">
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
                      {item.quantity} × {money(item.price)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-fg">
                    {money(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between text-fg-muted">
                <dt>{t("cart.subtotal")}</dt>
                <dd>{money(order.subtotal)}</dd>
              </div>
              {order.discount > 0 ? (
                <div className="flex justify-between text-success-fg">
                  <dt>
                    {t("cart.discount")}
                    {order.couponCode ? ` (${order.couponCode})` : ""}
                  </dt>
                  <dd>−{money(order.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between text-fg-muted">
                <dt>{t("cart.shipping")}</dt>
                <dd>
                  {order.shipping === 0 ? t("cart.free") : money(order.shipping)}
                </dd>
              </div>
              <div className="flex justify-between text-fg-muted">
                <dt>{t("cart.tax")}</dt>
                <dd>{money(order.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-bold text-fg">{t("cart.total")}</dt>
                <dd className="font-black text-fg-strong">{money(order.total)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
              <Mail className="h-4 w-4 text-brand-fg" />
              {t("admin.customer")}
            </h2>
            <p className="mt-3 text-sm font-semibold text-fg">
              {order.shippingName}
            </p>
            <p className="text-xs text-fg-muted">{order.email}</p>
            {order.user ? (
              <p className="mt-1 text-xs text-fg-subtle">
                {t("admin.registered")}: {order.user.name}
              </p>
            ) : null}
            {order.phone ? (
              <p className="mt-1 text-xs text-fg-muted">{order.phone}</p>
            ) : null}
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
              <MapPin className="h-4 w-4 text-brand-fg" />
              {t("admin.shippingAddress")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-fg-muted">
              {order.address1}
              {order.address2 ? (
                <>
                  <br />
                  {order.address2}
                </>
              ) : null}
              <br />
              {order.city} {order.state} {order.postalCode}
              <br />
              {order.country}
            </p>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
              <Wallet className="h-4 w-4 text-brand-fg" />
              {t("admin.payment")}
            </h2>
            <p className="mt-3 text-sm text-fg-muted">{order.paymentMethod}</p>
            {order.paymentRef ? (
              <p className="text-xs text-fg-subtle">{order.paymentRef}</p>
            ) : null}
            {order.notes ? (
              <p className="mt-3 text-xs text-fg-muted">
                <strong>{t("admin.note")}:</strong> {order.notes}
              </p>
            ) : null}
          </section>

          <section className="card flex items-start gap-3 p-4 text-xs text-fg-muted">
            <Package className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" />
            {t("admin.guide.ordersBody")}
          </section>
        </div>
      </div>
    </div>
  );
}
