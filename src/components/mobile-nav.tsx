"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

export function MobileNav({
  categories,
}: {
  categories: { name: string; slug: string }[];
}) {
  const [open, setOpen] = useState(false);
  const { t, categoryName } = useI18n();

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="grid h-10 w-10 place-items-center rounded-lg text-fg transition hover:bg-surface-3"
        aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open ? (
        <div className="fixed inset-x-0 top-[9.75rem] z-40 max-h-[calc(100vh-10rem)] overflow-y-auto border-b border-line bg-surface p-4 shadow-lift sm:top-[9.5rem]">
          <nav className="grid gap-1">
            <Link
              href="/products"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-fg hover:bg-surface-2"
            >
              {t("nav.shopAll")}
            </Link>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-fg-muted hover:bg-surface-2"
              >
                {categoryName(category.slug, category.name)}
              </Link>
            ))}
            <div className="my-2 h-px bg-line" />
            <Link
              href="/products?deals=1"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-fg hover:bg-brand-soft"
            >
              {t("nav.deals")}
            </Link>
            <Link
              href="/account/wishlist"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-fg-muted hover:bg-surface-2"
            >
              {t("nav.wishlist")}
            </Link>
            <Link
              href="/account/orders"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-fg-muted hover:bg-surface-2"
            >
              {t("nav.orders")}
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
