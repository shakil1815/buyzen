import Link from "next/link";
import {
  CreditCard,
  Globe,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { NewsletterForm } from "@/components/newsletter-form";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";

export async function SiteFooter() {
  const [categories, t] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    }),
    getT(),
  ]);

  const links = {
    shop: [
      { href: "/products", label: t("nav.shopAll") },
      { href: "/products?deals=1", label: t("nav.deals") },
      { href: "/products?sort=newest", label: t("nav.newArrivals") },
    ],
    account: [
      { href: "/account", label: t("nav.account") },
      { href: "/account/orders", label: t("nav.orders") },
      { href: "/account/wishlist", label: t("nav.wishlist") },
      { href: "/login", label: t("nav.signIn") },
      { href: "/register", label: t("nav.createAccount") },
    ],
    help: [
      { href: "/help", label: t("help.shipping") },
      { href: "/help#returns", label: t("help.returns") },
      { href: "/help#contact", label: t("help.contactTitle") },
      { href: "/help#faq", label: t("help.faq") },
    ],
  };

  return (
    <footer className="mt-20 border-t border-line bg-surface-2">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-sm font-black text-white">
              SF
            </span>
            <span className="text-lg font-black tracking-tight text-fg-strong">
              ShopFront
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-fg-muted">
            {t("footer.about")}
          </p>
          <NewsletterForm />
        </div>

        <div>
          <h3 className="text-sm font-bold text-fg">{t("footer.shop")}</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {links.shop.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-fg-muted hover:text-brand-fg">
                  {link.label}
                </Link>
              </li>
            ))}
            {categories.slice(0, 3).map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/products?category=${category.slug}`}
                  className="text-fg-muted hover:text-brand-fg"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-fg">{t("footer.account")}</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {links.account.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-fg-muted hover:text-brand-fg">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-fg">{t("footer.help")}</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {links.help.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-fg-muted hover:text-brand-fg">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-6 text-xs text-fg-muted sm:flex-row">
          <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
          <div className="flex flex-wrap items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> {t("footer.secure")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PackageCheck className="h-4 w-4" /> {t("footer.tracked")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <RotateCcw className="h-4 w-4" /> {t("footer.returns")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" /> {t("footer.cards")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-4 w-4" /> {t("footer.worldwide")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
