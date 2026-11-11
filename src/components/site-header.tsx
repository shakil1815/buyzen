import Link from "next/link";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  ShoppingCart,
  Sparkles,
  User,
} from "lucide-react";
import { getCart } from "@/lib/cart";
import { getSession } from "@/lib/session";
import { logoutAction } from "@/lib/actions/auth";
import { prisma } from "@/lib/prisma";
import { SearchBar } from "@/components/search-bar";
import { MobileNav } from "@/components/mobile-nav";
import { SettingsMenu } from "@/components/settings-menu";
import { categoryLabel, getT } from "@/lib/i18n/server";

export async function SiteHeader() {
  const [session, cart, t] = await Promise.all([getSession(), getCart(), getT()]);
  const itemCount =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { name: true, slug: true },
  });

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="bg-ink-950 text-white">
        <div className="container-page flex h-9 items-center justify-center gap-2 text-center text-[11px] font-medium tracking-wide sm:text-xs">
          <Sparkles className="h-3.5 w-3.5 text-brand-300" aria-hidden />
          <span>{t("announcement.shipping")}</span>
          <span className="hidden text-ink-500 sm:inline">•</span>
          <span className="hidden sm:inline">
            {t("announcement.welcome", { code: "WELCOME10" })}
          </span>
        </div>
      </div>

      <div className="border-b border-line bg-surface/85 backdrop-blur-md">
        <div className="container-page flex h-16 items-center gap-3 lg:gap-6">
          <MobileNav categories={categories} />

          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-sm font-black text-white">
              SF
            </span>
            <span className="hidden text-lg font-black tracking-tight text-fg-strong sm:block">
              ShopFront
            </span>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex">
            <Link
              href="/products"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-fg transition hover:bg-surface-3 hover:text-fg-strong"
            >
              {t("nav.shopAll")}
            </Link>
            {categories.slice(0, 5).map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                className="rounded-lg px-3 py-2 text-sm font-medium text-fg-muted transition hover:bg-surface-3 hover:text-fg-strong"
              >
                {categoryLabel(t, category.slug, category.name)}
              </Link>
            ))}
          </nav>

          <div className="hidden min-w-0 flex-1 lg:block">
            <SearchBar />
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <SettingsMenu />

            <Link
              href="/account/wishlist"
              className="hidden rounded-lg p-2 text-fg-muted transition hover:bg-surface-3 hover:text-fg-strong sm:block"
              aria-label={t("nav.wishlist")}
              title={t("nav.wishlist")}
            >
              <Heart className="h-5 w-5" />
            </Link>

            {session ? (
              <>
                <Link
                  href="/account"
                  className="hidden items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-fg transition hover:bg-surface-3 sm:flex"
                >
                  <User className="h-5 w-5" />
                  {session.name.split(" ")[0]}
                </Link>
                {session.role === "ADMIN" ? (
                  <Link
                    href="/admin"
                    className="rounded-lg p-2 text-fg-muted transition hover:bg-surface-3 hover:text-fg-strong"
                    aria-label={t("nav.admin")}
                    title={t("nav.admin")}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                  </Link>
                ) : null}
                <form action={logoutAction} className="hidden sm:block">
                  <button
                    type="submit"
                    className="rounded-lg p-2 text-fg-muted transition hover:bg-surface-3 hover:text-fg-strong"
                    aria-label={t("nav.signOut")}
                    title={t("nav.signOut")}
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-fg transition hover:bg-surface-3 sm:flex"
              >
                <User className="h-5 w-5" />
                {t("nav.signIn")}
              </Link>
            )}

            <Link
              href="/cart"
              className="relative rounded-lg p-2 text-fg transition hover:bg-surface-3 hover:text-fg-strong"
              aria-label={`${t("nav.cart")}, ${itemCount}`}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        <div className="container-page pb-3 lg:hidden">
          <SearchBar />
        </div>
      </div>

      {session ? null : (
        <div className="border-b border-line bg-surface px-4 py-2 text-center text-xs text-fg-muted sm:hidden">
          <Link href="/login" className="font-semibold text-brand-fg">
            {t("nav.signIn")}
          </Link>
          <span className="mx-2 text-fg-subtle">|</span>
          <Link href="/register" className="font-semibold text-brand-fg">
            {t("nav.createAccount")}
          </Link>
        </div>
      )}
    </header>
  );
}
