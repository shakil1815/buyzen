import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, Package, Settings, ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "My account",
  description: "Manage your ShopFront profile, orders and wishlist.",
};

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");

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
          <h1 className="text-3xl font-black tracking-tight text-ink-950">
            Hi {session.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Signed in as {session.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/account/orders" className="btn btn-outline">
            <Package className="h-4 w-4" /> Orders
          </Link>
          <Link href="/account/wishlist" className="btn btn-outline">
            <Heart className="h-4 w-4" /> Wishlist
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: ShoppingBag,
            label: "Orders placed",
            value: String(totalOrders),
            href: "/account/orders",
          },
          {
            icon: Heart,
            label: "Saved items",
            value: String(wishlistCount),
            href: "/account/wishlist",
          },
          {
            icon: Settings,
            label: "Lifetime spend",
            value: formatMoney(spent._sum.total ?? 0),
            href: "/account/orders",
          },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="card flex items-center gap-4 p-5 transition hover:shadow-lift"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <stat.icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xl font-black text-ink-950">
                {stat.value}
              </span>
              <span className="block text-xs text-ink-500">{stat.label}</span>
            </span>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight text-ink-950">
            Recent orders
          </h2>
          <Link
            href="/account/orders"
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            View all
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="card mt-4 flex flex-col items-center gap-3 py-14 text-center">
            <Package className="h-8 w-8 text-ink-300" />
            <p className="text-sm text-ink-500">
              You haven&apos;t placed an order yet.
            </p>
            <Link href="/products" className="btn btn-primary mt-1">
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {orders.map((order) => (
              <li key={order.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      {order.number}
                    </p>
                    <p className="text-xs text-ink-500">
                      {formatDate(order.createdAt)} · {order.items.length}{" "}
                      {order.items.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge bg-ink-100 text-ink-700">
                      {order.status}
                    </span>
                    <span className="text-sm font-bold text-ink-950">
                      {formatMoney(order.total)}
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
