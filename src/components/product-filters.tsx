"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { SlidersHorizontal, X } from "lucide-react";

type Category = { id: string; name: string; slug: string; count: number };

export function ProductFilters({
  categories,
}: {
  categories: Category[];
}) {
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
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 ? (
            <span className="badge bg-brand-50 text-brand-700">{activeCount}</span>
          ) : null}
        </h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-ink-900"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        ) : null}
      </div>

      <div className="mt-5 space-y-6">
        <div>
          <p className="label">Category</p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => update("category", item.slug === category ? null : item.slug)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  category === item.slug
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-ink-200 text-ink-600 hover:border-ink-400"
                }`}
              >
                {item.name}
                <span className="ml-1 text-[10px] opacity-70">{item.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="label">Price</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder="Min"
              defaultValue={minPrice}
              onBlur={(event) =>
                update("min", event.target.value ? String(event.target.value) : null)
              }
              className="input"
              aria-label="Minimum price"
            />
            <span className="text-ink-400">–</span>
            <input
              type="number"
              min={0}
              placeholder="Max"
              defaultValue={maxPrice}
              onBlur={(event) =>
                update("max", event.target.value ? String(event.target.value) : null)
              }
              className="input"
              aria-label="Maximum price"
            />
          </div>
        </div>

        <div>
          <p className="label">Minimum rating</p>
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
                    : "border-ink-200 text-ink-600 hover:border-ink-400"
                }`}
              >
                ★ {value}+
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <label className="flex items-center gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(event) =>
                update("stock", event.target.checked ? "1" : null)
              }
              className="h-4 w-4 rounded border-ink-300 text-brand-600"
            />
            In stock only
          </label>
          <label className="flex items-center gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={deals}
              onChange={(event) =>
                update("deals", event.target.checked ? "1" : null)
              }
              className="h-4 w-4 rounded border-ink-300 text-brand-600"
            />
            On sale
          </label>
        </div>
      </div>
    </aside>
  );
}

export function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const sort = params.get("sort") ?? "featured";

  return (
    <label className="flex items-center gap-2 text-sm text-ink-600">
      <span className="hidden sm:inline">Sort by</span>
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
        <option value="featured">Featured</option>
        <option value="newest">Newest</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
        <option value="rating">Top rated</option>
        <option value="name">Name A–Z</option>
      </select>
    </label>
  );
}
