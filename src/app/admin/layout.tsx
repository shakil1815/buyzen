import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAdminContext, ROLE_LABELS, isAdminRole } from "@/lib/permissions";
import { ADMIN_NAV, ADMIN_ICONS } from "@/lib/admin/nav";
import { BrandMark } from "@/components/brand";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const context = await getAdminContext();
  if (!context) redirect("/login?next=/admin");

  const unread = await prisma.notification.count({ where: { read: false } });

  const groups = ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      context.permissions.includes(item.permission),
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="min-h-screen bg-surface-2">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="container-page flex h-16 items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark className="h-8 w-8" />
            <span className="hidden text-base font-black tracking-tight text-fg-strong sm:block">
              BuyZen
              <span className="ml-2 rounded-md bg-surface-3 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fg-muted">
                Admin
              </span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/admin/notifications"
              className="relative rounded-lg p-2 text-fg-muted transition hover:bg-surface-3"
              aria-label={`Notifications (${unread} unread)`}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : null}
            </Link>

            <div className="hidden items-center gap-2 rounded-lg border border-line px-3 py-1.5 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-fg">
                {context.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="text-xs">
                <span className="block font-semibold text-fg">{context.name}</span>
                <span className="block text-[10px] uppercase tracking-wide text-fg-subtle">
                  {isAdminRole(context.role)
                    ? ROLE_LABELS[context.role]
                    : context.role}
                </span>
              </span>
            </div>

            <form action={logoutActionProxy} className="hidden sm:block">
              <button
                type="submit"
                className="rounded-lg p-2 text-fg-muted transition hover:bg-surface-3"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="container-page flex flex-col gap-6 py-6 lg:flex-row">
        <aside className="lg:w-60 lg:shrink-0">
          <AdminNav groups={groups} icons={ADMIN_ICONS} />
        </aside>

        <main className="min-w-0 flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}

async function logoutActionProxy() {
  "use server";
  const { logoutAction } = await import("@/lib/actions/auth");
  await logoutAction();
}
