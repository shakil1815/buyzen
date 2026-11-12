import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, Package, Settings, ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDate, formatMoney } from "@/lib/format";
import { getDateLocale, getT } from "@/lib/i18n/server";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";

export const metadata: Metadata = {
  title: "My account",
  description: "Manage your BuyZen profile, orders and wishlist.",
};

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");

  const [t, currency, dateLocale] = await Promise.all([
    getT(),
    getCurrency(),
    getDateLocale(),
  ]);
  const rate = usdToBdtRate();
  const money = (cents: number) => formatMoney(cents, currency, rate);

  const [orders, wishlistCount, spent] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.wishlistItem.count({ where: { userId: session.id } }),
    prisma.order.aggregate({
      where: { userId: session.id },
      _sum: { total: true },
    }),
  ]);

  const totalOrders = await prisma.order.count({ where: { userId: session.id } });

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-fg-strong">
            {t("account.greeting", { name: session.name.split(" ")[0] })}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {t("account.signedInAs", { email: session.email })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/account/orders" className="btn btn-outline">
            <Package className="h-4 w-4" /> {t("nav.orders")}
          </Link>
          <Link href="/account/wishlist" className="btn btn-outline">
            <Heart className="h-4 w-4" /> {t("nav.wishlist")}
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: ShoppingBag,
            label: t("account.ordersPlaced"),
            value: String(totalOrders),
            href: "/account/orders",
          },
          {
            icon: Heart,
            label: t("account.savedItems"),
            value: String(wishlistCount),
            href: "/account/wishlist",
          },
          {
            icon: Settings,
            label: t("account.lifetimeSpend"),
            value: money(spent._sum.total ?? 0),
            href: "/account/orders",
          },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="card flex items-center gap-4 p-5 transition hover:shadow-lift"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand-fg">
              <stat.icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xl font-black text-fg-strong">
                {stat.value}
              </span>
              <span className="block text-xs text-fg-muted">{stat.label}</span>
            </span>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight text-fg-strong">
            {t("account.recentOrders")}
          </h2>
          <Link
            href="/account/orders"
            className="text-sm font-semibold text-brand-fg hover:text-brand-600"
          >
            {t("common.viewAll")}
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="card mt-4 flex flex-col items-center gap-3 py-14 text-center">
            <Package className="h-8 w-8 text-fg-subtle" />
            <p className="text-sm text-fg-muted">{t("account.noOrdersShort")}</p>
            <Link href="/products" className="btn btn-primary mt-1">
              {t("cart.startShopping")}
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {orders.map((order) => (
              <li key={order.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-fg">
                      {order.number}
                    </p>
                    <p className="text-xs text-fg-muted">
                      {formatDate(order.createdAt, dateLocale)} ·{" "}
                      {t("account.items", { count: order.items.length })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge bg-surface-3 text-fg-muted">
                      {order.status}
                    </span>
                    <span className="text-sm font-bold text-fg-strong">
                      {money(order.total)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
