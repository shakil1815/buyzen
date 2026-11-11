import Link from "next/link";
import { CreditCard, Globe, PackageCheck, RotateCcw, ShieldCheck } from "lucide-react";
import { NewsletterForm } from "@/components/newsletter-form";
import { prisma } from "@/lib/prisma";

export async function SiteFooter() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { name: true, slug: true },
  });

  return (
    <footer className="mt-20 border-t border-ink-100 bg-ink-50/60">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-sm font-black text-white">
              SF
            </span>
            <span className="text-lg font-black tracking-tight text-ink-950">
              ShopFront
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-600">
            A modern demo storefront for premium tech, audio, gaming and home
            goods. Free shipping over $150 and 30-day returns on everything.
          </p>
          <NewsletterForm />
        </div>

        <div>
          <h3 className="text-sm font-bold text-ink-900">Shop</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/products" className="text-ink-600 hover:text-brand-600">
                All products
              </Link>
            </li>
            <li>
              <Link
                href="/products?deals=1"
                className="text-ink-600 hover:text-brand-600"
              >
                Today&apos;s deals
              </Link>
            </li>
            <li>
              <Link
                href="/products?sort=newest"
                className="text-ink-600 hover:text-brand-600"
              >
                New arrivals
              </Link>
            </li>
            {categories.slice(0, 4).map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/products?category=${category.slug}`}
                  className="text-ink-600 hover:text-brand-600"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-ink-900">Account</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/account" className="text-ink-600 hover:text-brand-600">
                My account
              </Link>
            </li>
            <li>
              <Link
                href="/account/orders"
                className="text-ink-600 hover:text-brand-600"
              >
                Orders
              </Link>
            </li>
            <li>
              <Link
                href="/account/wishlist"
                className="text-ink-600 hover:text-brand-600"
              >
                Wishlist
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-ink-600 hover:text-brand-600">
                Sign in
              </Link>
            </li>
            <li>
              <Link href="/register" className="text-ink-600 hover:text-brand-600">
                Create account
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-ink-900">Help</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/help" className="text-ink-600 hover:text-brand-600">
                Shipping &amp; delivery
              </Link>
            </li>
            <li>
              <Link href="/help#returns" className="text-ink-600 hover:text-brand-600">
                Returns &amp; refunds
              </Link>
            </li>
            <li>
              <Link href="/help#contact" className="text-ink-600 hover:text-brand-600">
                Contact us
              </Link>
            </li>
            <li>
              <Link href="/help#faq" className="text-ink-600 hover:text-brand-600">
                FAQ
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-100">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-6 text-xs text-ink-500 sm:flex-row">
          <p>© {new Date().getFullYear()} ShopFront. Demo storefront.</p>
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Secure checkout
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PackageCheck className="h-4 w-4" /> Tracked delivery
            </span>
            <span className="inline-flex items-center gap-1.5">
              <RotateCcw className="h-4 w-4" /> 30-day returns
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" /> Cards &amp; wallets
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-4 w-4" /> Worldwide
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
