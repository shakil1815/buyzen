import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/format";
import { getDateLocale, getT } from "@/lib/i18n/server";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Customers",
};

export default async function AdminCustomersPage() {
  const [t, currency, dateLocale] = await Promise.all([
    getT(),
    getCurrency(),
    getDateLocale(),
  ]);
  const rate = usdToBdtRate();

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      orders: { select: { total: true } },
      wishlist: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-fg-strong">
        {t("admin.customers.title")}
      </h1>
      <p className="mt-1 text-sm text-fg-muted">
        {t("admin.customers.body", { count: customers.length })}
      </p>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-fg-subtle">
            <tr>
              <th className="px-4 py-3 font-semibold">
                {t("admin.customers.customer")}
              </th>
              <th className="px-4 py-3 font-semibold">
                {t("admin.customers.joined")}
              </th>
              <th className="px-4 py-3 font-semibold">
                {t("admin.customers.orders")}
              </th>
              <th className="px-4 py-3 font-semibold">
                {t("admin.customers.wishlist")}
              </th>
              <th className="px-4 py-3 font-semibold">
                {t("admin.customers.value")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-fg">
                      {customer.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <p className="font-medium text-fg">{customer.name}</p>
                      <p className="text-[11px] text-fg-subtle">{customer.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-fg-muted">
                  {formatDate(customer.createdAt, dateLocale)}
                </td>
                <td className="px-4 py-3 text-fg-muted">{customer.orders.length}</td>
                <td className="px-4 py-3 text-fg-muted">{customer.wishlist.length}</td>
                <td className="px-4 py-3 font-semibold text-fg">
                  {formatMoney(
                    customer.orders.reduce((sum, order) => sum + order.total, 0),
                    currency,
                    rate,
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
