import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "Customers",
};

export default async function AdminCustomersPage() {
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
      <h1 className="text-2xl font-black tracking-tight text-ink-950">
        Customers
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        {customers.length} registered shoppers.
      </p>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold">Orders</th>
              <th className="px-4 py-3 font-semibold">Wishlist</th>
              <th className="px-4 py-3 font-semibold">Lifetime value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                      {customer.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <p className="font-medium text-ink-900">{customer.name}</p>
                      <p className="text-[11px] text-ink-400">{customer.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-600">
                  {formatDate(customer.createdAt)}
                </td>
                <td className="px-4 py-3 text-ink-600">{customer.orders.length}</td>
                <td className="px-4 py-3 text-ink-600">{customer.wishlist.length}</td>
                <td className="px-4 py-3 font-semibold text-ink-900">
                  {formatMoney(
                    customer.orders.reduce((sum, order) => sum + order.total, 0),
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
