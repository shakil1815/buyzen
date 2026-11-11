import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/format";
import { OrderStatusSelect } from "@/components/order-status-select";

export const metadata: Metadata = {
  title: "Orders",
};

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { items: true, user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const revenue = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink-950">
            Orders
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {orders.length} orders · {formatMoney(revenue)} gross
          </p>
        </div>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Items</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-ink-500">
                  No orders yet.
                </td>
              </tr>
            ) : null}
            {orders.map((order) => (
              <tr key={order.id} className="transition hover:bg-ink-50/60">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-900">{order.number}</p>
                  <p className="text-[11px] text-ink-400">
                    {formatDate(order.createdAt)}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-ink-800">{order.shippingName}</p>
                  <p className="text-[11px] text-ink-400">{order.email}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex -space-x-2">
                    {order.items.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-ink-100"
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
                      <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-ink-100 text-[10px] font-bold text-ink-600">
                        +{order.items.length - 4}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-ink-900">
                  {formatMoney(order.total)}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusSelect orderId={order.id} status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-ink-500">
        Need the full order detail?{" "}
        <Link href="/account/orders" className="font-semibold text-brand-600">
          Open the customer order view
        </Link>
        .
      </p>
    </div>
  );
}
