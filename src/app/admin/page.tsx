import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes, DollarSign, Package, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AdminDashboard() {
  const [t, currency] = await Promise.all([getT(), getCurrency()]);
  const rate = usdToBdtRate();
  const money = (cents: number) => formatMoney(cents, currency, rate);
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
      label: t("admin.revenue"),
      value: money(revenue._sum.total ?? 0),
    },
    { icon: Package, label: t("admin.orders"), value: String(orderCount) },
    { icon: Boxes, label: t("admin.products"), value: String(productCount) },
    {
      icon: Users,
      label: t("admin.customers"),
      value: String(customerCount),
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-fg-strong">
            {t("admin.dashboard.title")}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {t("admin.dashboard.body")}
          </p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          {t("admin.newProduct")}
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand-fg">
              <stat.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-2xl font-black tracking-tight text-fg-strong">
              {stat.value}
            </p>
            <p className="text-xs text-fg-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-fg">{t("admin.recentOrders")}</h2>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-fg"
            >
              {t("admin.allOrders")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {recentOrders.map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">
                    {order.number}
                  </p>
                  <p className="text-[11px] text-fg-muted">
                    {order.email} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-fg-strong">
                    {money(order.total)}
                  </p>
                  <span className="badge bg-surface-3 text-fg-muted">
                    {order.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-fg">{t("admin.lowStock")}</h2>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-fg"
            >
              {t("admin.manage")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {lowStock.length === 0 ? (
              <li className="py-6 text-center text-sm text-fg-muted">
                {t("admin.stockOk")}
              </li>
            ) : null}
            {lowStock.map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">
                    {product.name}
                  </p>
                  <p className="text-[11px] text-fg-muted">{product.sku}</p>
                </div>
                <span
                  className={`badge ${
                    product.stock === 0
                      ? "bg-danger-soft text-danger-fg"
                      : "bg-warn-soft text-warn-fg"
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
