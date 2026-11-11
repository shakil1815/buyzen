import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes, DollarSign, Package, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AdminDashboard() {
  const [revenue, orderCount, productCount, customerCount, recentOrders, lowStock] =
    await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: "CANCELLED" } },
      }),
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.product.findMany({
        where: { stock: { lte: 15 } },
        orderBy: { stock: "asc" },
        take: 6,
      }),
    ]);

  const stats = [
    {
      icon: DollarSign,
      label: "Gross revenue",
      value: formatMoney(revenue._sum.total ?? 0),
    },
    { icon: Package, label: "Orders", value: String(orderCount) },
    { icon: Boxes, label: "Products", value: String(productCount) },
    { icon: Users, label: "Customers", value: String(customerCount) },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink-950">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Store performance at a glance.
          </p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          New product
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <stat.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-2xl font-black tracking-tight text-ink-950">
              {stat.value}
            </p>
            <p className="text-xs text-ink-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-900">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600"
            >
              All orders <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-ink-100">
            {recentOrders.map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {order.number}
                  </p>
                  <p className="text-[11px] text-ink-500">
                    {order.email} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-ink-950">
                    {formatMoney(order.total)}
                  </p>
                  <span className="badge bg-ink-100 text-ink-600">
                    {order.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-900">Low stock alerts</h2>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600"
            >
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-ink-100">
            {lowStock.length === 0 ? (
              <li className="py-6 text-center text-sm text-ink-500">
                Every product is comfortably in stock.
              </li>
            ) : null}
            {lowStock.map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {product.name}
                  </p>
                  <p className="text-[11px] text-ink-500">{product.sku}</p>
                </div>
                <span
                  className={`badge ${
                    product.stock === 0
                      ? "bg-rose-50 text-rose-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {product.stock} left
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
