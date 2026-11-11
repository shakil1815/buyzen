"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function MobileNav({
  categories,
}: {
  categories: { name: string; slug: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg p-2 text-ink-700 transition hover:bg-ink-100"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open ? (
        <div className="fixed inset-x-0 top-[100px] z-40 max-h-[70vh] overflow-y-auto border-b border-ink-100 bg-white p-4 shadow-lift">
          <nav className="grid gap-1">
            <Link
              href="/products"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50"
            >
              Shop all
            </Link>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
              >
                {category.name}
              </Link>
            ))}
            <div className="my-2 h-px bg-ink-100" />
            <Link
              href="/products?deals=1"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
            >
              Today&apos;s deals
            </Link>
            <Link
              href="/account/wishlist"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
            >
              Wishlist
            </Link>
            <Link
              href="/account/orders"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
            >
              Orders
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
