"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { formatMoney } from "@/lib/format";

type Suggestion = {
  slug: string;
  name: string;
  price: number;
  image: string;
  category: string;
};

export function SearchBar() {
  const { t, currency, usdToBdt } = useI18n();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.trim().length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as { products: Suggestion[] };
        setSuggestions(data.products ?? []);
        setOpen(true);
      } catch {
        /* aborted or offline - ignore */
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOpen(false);
    router.push(`/products?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={submit} role="search">
        <label className="sr-only" htmlFor="site-search">
          {t("nav.searchLabel")}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
          <input
            id="site-search"
            name="q"
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              if (value.trim().length < 2) {
                setSuggestions([]);
                setOpen(false);
              }
            }}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder={t("nav.searchPlaceholder")}
            className="input pl-9 pr-9"
            autoComplete="off"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-subtle hover:bg-surface-3 hover:text-fg-muted"
              aria-label={t("nav.clearSearch")}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </form>

      {open && suggestions.length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-line bg-surface shadow-lift">
          <ul className="max-h-80 overflow-y-auto">
            {suggestions.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/products/${item.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-surface-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">
                      {item.name}
                    </span>
                    <span className="block text-xs text-fg-muted">
                      {item.category}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-fg">
                    {formatMoney(item.price, currency, usdToBdt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push(`/products?q=${encodeURIComponent(query.trim())}`);
            }}
            className="block w-full border-t border-line px-3 py-2 text-left text-xs font-semibold text-brand-fg hover:bg-brand-soft"
          >
            {t("nav.viewResults")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
