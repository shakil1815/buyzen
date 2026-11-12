import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/format";
import { OrderStatusSelect } from "@/components/order-status-select";
import { getDateLocale, getT } from "@/lib/i18n/server";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Orders",
};

export default async function AdminOrdersPage() {
  const [t, currency, dateLocale] = await Promise.all([
    getT(),
    getCurrency(),
    getDateLocale(),
  ]);
  const rate = usdToBdtRate();

  const orders = await prisma.order.findMany({
    include: { items: true, user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const revenue = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-fg-strong">
            {t("admin.orders.title")}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {t("admin.orders.summary", {
              count: orders.length,
              revenue: formatMoney(revenue, currency, rate),
            })}
          </p>
        </div>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-fg-subtle">
            <tr>
              <th className="px-4 py-3 font-semibold">{t("admin.orders.order")}</th>
              <th className="px-4 py-3 font-semibold">
                {t("admin.orders.customer")}
              </th>
              <th className="px-4 py-3 font-semibold">{t("admin.orders.items")}</th>
              <th className="px-4 py-3 font-semibold">{t("admin.orders.total")}</th>
              <th className="px-4 py-3 font-semibold">
                {t("admin.orders.status")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-fg-muted"
                >
                  {t("admin.orders.empty")}
                </td>
              </tr>
            ) : null}
            {orders.map((order) => (
              <tr key={order.id} className="transition hover:bg-surface-2/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium text-fg hover:text-brand-fg"
                  >
                    {order.number}
                  </Link>
                  <p className="text-[11px] text-fg-subtle">
                    {formatDate(order.createdAt, dateLocale)}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-fg">{order.shippingName}</p>
                  <p className="text-[11px] text-fg-subtle">{order.email}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex -space-x-2">
                    {order.items.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-surface-3"
                        title={`${item.name} × ${item.quantity}`}
                      >
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </div>
                    ))}
                    {order.items.length > 4 ? (
                      <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-surface-3 text-[10px] font-bold text-fg-muted">
                        +{order.items.length - 4}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-fg">
                  {formatMoney(order.total, currency, rate)}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusSelect orderId={order.id} status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-fg-muted">
        {t("admin.orders.customerView")}{" "}
        <Link href="/account/orders" className="font-semibold text-brand-fg">
          →
        </Link>
      </p>
    </div>
  );
}
