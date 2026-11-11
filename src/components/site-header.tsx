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

export async function SiteHeader() {
  const [session, cart] = await Promise.all([getSession(), getCart()]);
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
          <span>Free shipping over $150</span>
          <span className="hidden text-ink-500 sm:inline">•</span>
          <span className="hidden sm:inline">
            New here? Use code <strong className="text-brand-300">WELCOME10</strong> for
            10% off
          </span>
        </div>
      </div>

      <div className="border-b border-ink-100 bg-white/85 backdrop-blur-md">
        <div className="container-page flex h-16 items-center gap-3 lg:gap-6">
          <MobileNav categories={categories} />

          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-sm font-black text-white">
              SF
            </span>
            <span className="hidden text-lg font-black tracking-tight text-ink-950 sm:block">
              ShopFront
            </span>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex">
            <Link
              href="/products"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-100 hover:text-ink-950"
            >
              Shop all
            </Link>
            {categories.slice(0, 5).map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-100 hover:text-ink-950"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          <div className="hidden min-w-0 flex-1 lg:block">
            <SearchBar />
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link
              href="/account/wishlist"
              className="rounded-lg p-2 text-ink-600 transition hover:bg-ink-100 hover:text-ink-950"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart className="h-5 w-5" />
            </Link>

            {session ? (
              <>
                <Link
                  href="/account"
                  className="hidden items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-100 sm:flex"
                >
                  <User className="h-5 w-5" />
                  {session.name.split(" ")[0]}
                </Link>
                {session.role === "ADMIN" ? (
                  <Link
                    href="/admin"
                    className="rounded-lg p-2 text-ink-600 transition hover:bg-ink-100 hover:text-ink-950"
                    aria-label="Admin dashboard"
                    title="Admin dashboard"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                  </Link>
                ) : null}
                <form action={logoutAction} className="hidden sm:block">
                  <button
                    type="submit"
                    className="rounded-lg p-2 text-ink-600 transition hover:bg-ink-100 hover:text-ink-950"
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-100 hover:text-ink-950 sm:flex"
              >
                <User className="h-5 w-5" />
                Sign in
              </Link>
            )}

            <Link
              href="/cart"
              className="relative rounded-lg p-2 text-ink-700 transition hover:bg-ink-100 hover:text-ink-950"
              aria-label={`Cart, ${itemCount} items`}
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
        <div className="border-b border-ink-100 bg-white px-4 py-2 text-center text-xs text-ink-600 sm:hidden">
          <Link href="/login" className="font-semibold text-brand-600">
            Sign in
          </Link>
          <span className="mx-2 text-ink-300">|</span>
          <Link href="/register" className="font-semibold text-brand-600">
            Create account
          </Link>
        </div>
      )}
    </header>
  );
}
