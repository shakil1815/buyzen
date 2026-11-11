import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tag,
  Users,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login?next=/admin");

  const t = await getT();

  const nav = [
    { href: "/admin", label: t("admin.nav.dashboard"), icon: LayoutDashboard },
    { href: "/admin/products", label: t("admin.nav.products"), icon: Package },
    { href: "/admin/orders", label: t("admin.nav.orders"), icon: ShoppingBag },
    { href: "/admin/coupons", label: t("admin.nav.coupons"), icon: Tag },
    { href: "/admin/customers", label: t("admin.nav.customers"), icon: Users },
  ];

  return (
    <div className="container-page py-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <div className="card p-3">
            <p className="px-2 py-1.5 text-xs font-bold uppercase tracking-wide text-fg-subtle">
              {t("admin.nav.title")}
            </p>
            <nav className="mt-1 space-y-0.5">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-fg-muted transition hover:bg-surface-2 hover:text-fg-strong"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
