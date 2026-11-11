"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

type Category = { id: string; name: string; slug: string; count: number };

export function ProductFilters({
  categories,
}: {
  categories: Category[];
}) {
  const { t, categoryName } = useI18n();
  const router = useRouter();
  const params = useSearchParams();

  const update = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (!value) next.delete(key);
      else next.set(key, value);
      router.push(`/products?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  const category = params.get("category") ?? "";
  const minPrice = params.get("min") ?? "";
  const maxPrice = params.get("max") ?? "";
  const inStock = params.get("stock") === "1";
  const deals = params.get("deals") === "1";
  const minRating = params.get("rating") ?? "";

  const activeCount = [
    category,
    minPrice,
    maxPrice,
    inStock ? "1" : "",
    deals ? "1" : "",
    minRating,
  ].filter(Boolean).length;

  return (
    <aside className="card h-fit p-5 lg:sticky lg:top-32">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
          <SlidersHorizontal className="h-4 w-4" />
          {t("products.filters")}
          {activeCount > 0 ? (
            <span className="badge bg-brand-soft text-brand-fg">{activeCount}</span>
          ) : null}
        </h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-fg-muted hover:text-fg"
          >
            <X className="h-3.5 w-3.5" /> {t("products.clear")}
          </button>
        ) : null}
      </div>

      <div className="mt-5 space-y-6">
        <div>
          <p className="label">{t("products.category")}</p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => update("category", item.slug === category ? null : item.slug)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  category === item.slug
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-line-strong text-fg-muted hover:border-ink-400"
                }`}
              >
                {categoryName(item.slug, item.name)}
                <span className="ml-1 text-[10px] opacity-70">{item.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="label">{t("products.price")}</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder={t("products.minPrice")}
              defaultValue={minPrice}
              onBlur={(event) =>
                update("min", event.target.value ? String(event.target.value) : null)
              }
              className="input"
              aria-label={t("products.minPrice")}
            />
            <span className="text-fg-subtle">–</span>
            <input
              type="number"
              min={0}
              placeholder={t("products.maxPrice")}
              defaultValue={maxPrice}
              onBlur={(event) =>
                update("max", event.target.value ? String(event.target.value) : null)
              }
              className="input"
              aria-label={t("products.maxPrice")}
            />
          </div>
        </div>

        <div>
          <p className="label">{t("products.minRating")}</p>
          <div className="flex flex-wrap gap-1.5">
            {["4", "3"].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  update("rating", minRating === value ? null : value)
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  minRating === value
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-line-strong text-fg-muted hover:border-ink-400"
                }`}
              >
                ★ {value}+
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <label className="flex items-center gap-2.5 text-sm text-fg-muted">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(event) =>
                update("stock", event.target.checked ? "1" : null)
              }
              className="h-4 w-4 rounded border-line-strong text-brand-fg"
            />
            {t("products.inStock")}
          </label>
          <label className="flex items-center gap-2.5 text-sm text-fg-muted">
            <input
              type="checkbox"
              checked={deals}
              onChange={(event) =>
                update("deals", event.target.checked ? "1" : null)
              }
              className="h-4 w-4 rounded border-line-strong text-brand-fg"
            />
            {t("products.onSale")}
          </label>
        </div>
      </div>
    </aside>
  );
}

export function SortSelect() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const sort = params.get("sort") ?? "featured";

  return (
    <label className="flex items-center gap-2 text-sm text-fg-muted">
      <span className="hidden sm:inline">{t("products.sortBy")}</span>
      <select
        value={sort}
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          if (event.target.value === "featured") next.delete("sort");
          else next.set("sort", event.target.value);
          router.push(`/products?${next.toString()}`, { scroll: false });
        }}
        className="input w-auto py-2 text-sm"
      >
        <option value="featured">{t("products.sort.featured")}</option>
        <option value="newest">{t("products.sort.newest")}</option>
        <option value="price-asc">{t("products.sort.priceAsc")}</option>
        <option value="price-desc">{t("products.sort.priceDesc")}</option>
        <option value="rating">{t("products.sort.rating")}</option>
        <option value="name">{t("products.sort.name")}</option>
      </select>
    </label>
  );
}
