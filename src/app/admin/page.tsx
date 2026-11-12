import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CircleDollarSign,
  Package,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";
import { SalesChart, type SalesPoint } from "@/components/admin/sales-chart";

export const metadata: Metadata = {
  title: "Dashboard",
};

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function AdminDashboard() {
  const [t, currency] = await Promise.all([getT(), getCurrency()]);
  const rate = usdToBdtRate();
  const money = (cents: number) => formatMoney(cents, currency, rate);

  const now = new Date();
  const since = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);

  const [
    revenue,
    revenueWindow,
    orderCount,
    orderCountWindow,
    productCount,
    customerCount,
    recentOrders,
    lowStock,
    windowOrders,
    orderItems,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: "CANCELLED" } },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: "CANCELLED" }, createdAt: { gte: since } },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: since } } }),
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
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, total: true, status: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "name"],
      _sum: { quantity: true, price: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  // 14 day revenue series
  const series: SalesPoint[] = [];
  for (let index = 0; index < 14; index += 1) {
    const day = new Date(since);
    day.setDate(day.getDate() + index);
    const key = dayKey(day);
    const dayOrders = windowOrders.filter(
      (order) => dayKey(order.createdAt) === key && order.status !== "CANCELLED",
    );
    series.push({
      label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
      orders: dayOrders.length,
    });
  }

  const averageOrderValue =
    orderCount > 0 ? Math.round((revenue._sum.total ?? 0) / orderCount) : 0;

  const stats = [
    {
      icon: CircleDollarSign,
      label: t("admin.revenue"),
      value: money(revenue._sum.total ?? 0),
      hint: `${money(revenueWindow._sum.total ?? 0)} · 14d`,
    },
    {
      icon: ShoppingBag,
      label: t("admin.orders"),
      value: String(orderCount),
      hint: `+${orderCountWindow} · 14d`,
    },
    {
      icon: TrendingUp,
      label: t("admin.aov"),
      value: money(averageOrderValue),
      hint: t("admin.aovHint"),
    },
    {
      icon: Boxes,
      label: t("admin.products"),
      value: String(productCount),
      hint: `${lowStock.length} ${t("admin.lowStockShort")}`,
    },
    {
      icon: Users,
      label: t("admin.customers"),
      value: String(customerCount),
      hint: t("admin.registered"),
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand-fg">
              <stat.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-2xl font-black tracking-tight text-fg-strong">
              {stat.value}
            </p>
            <p className="text-xs font-medium text-fg">{stat.label}</p>
            <p className="mt-0.5 text-[11px] text-fg-subtle">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-fg">{t("admin.sales")}</h2>
            <span className="badge bg-surface-3 text-fg-muted">14d</span>
          </div>
          <div className="mt-5">
            <SalesChart points={series} currency={currency} rate={rate} />
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-fg">{t("admin.topProducts")}</h2>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-fg"
            >
              {t("admin.manage")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {orderItems.length === 0 ? (
              <li className="py-6 text-center text-sm text-fg-muted">
                {t("admin.noSales")}
              </li>
            ) : null}
            {orderItems.map((item, index) => (
              <li key={`${item.productId}-${index}`} className="flex items-center gap-3 py-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-3 text-xs font-bold text-fg-muted">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-fg-subtle">
                    {item._sum.quantity} {t("admin.unitsSold")}
                  </p>
                </div>
                <p className="text-sm font-semibold text-fg">
                  {money((item._sum.quantity ?? 0) * (item._sum.price ?? 0))}
                </p>
              </li>
            ))}
          </ul>
        </section>
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
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="truncate text-sm font-medium text-fg hover:text-brand-fg"
                  >
                    {order.number}
                  </Link>
                  <p className="text-[11px] text-fg-subtle">
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
            <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
              <TriangleAlert className="h-4 w-4 text-warn-fg" />
              {t("admin.lowStock")}
            </h2>
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
                  <p className="text-[11px] text-fg-subtle">{product.sku}</p>
                </div>
                <span
                  className={`badge ${
                    product.stock === 0
                      ? "bg-danger-soft text-danger-fg"
                      : "bg-warn-soft text-warn-fg"
                  }`}
                >
                  {product.stock === 0
                    ? t("admin.outOfStock")
                    : t("admin.products.left", { count: product.stock })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card mt-6 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
          <Sparkles className="h-4 w-4 text-brand-fg" />
          {t("admin.guide.title")}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              href: "/admin/products",
              icon: Package,
              title: t("admin.guide.products"),
              body: t("admin.guide.productsBody"),
            },
            {
              href: "/admin/orders",
              icon: ShoppingBag,
              title: t("admin.guide.orders"),
              body: t("admin.guide.ordersBody"),
            },
            {
              href: "/admin/coupons",
              icon: Sparkles,
              title: t("admin.guide.coupons"),
              body: t("admin.guide.couponsBody"),
            },
            {
              href: "/admin/customers",
              icon: Users,
              title: t("admin.guide.customers"),
              body: t("admin.guide.customersBody"),
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border border-line bg-surface-2 p-4 transition hover:border-brand-200 hover:bg-brand-soft"
            >
              <item.icon className="h-4 w-4 text-brand-fg" />
              <p className="mt-2 text-sm font-semibold text-fg">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                {item.body}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
