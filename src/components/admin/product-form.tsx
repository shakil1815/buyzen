"use client";

import { useActionState } from "react";
import { AlertCircle, Check, Loader2, Save } from "lucide-react";
import {
  saveCatalogueProductAction,
  type CatalogueState,
} from "@/lib/actions/admin-catalogue";

export type ProductFormValues = {
  id?: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  cost: number | null;
  stock: number;
  lowStockThreshold: number;
  brand: string | null;
  sku: string | null;
  categoryId: string;
  featured: boolean;
  image?: string | null;
  gallery?: string[];
  sizes?: string[];
  colors?: string[];
  variants?: string[];
};

export function ProductForm({
  categories,
  brands,
  product,
}: {
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  product?: ProductFormValues;
}) {
  const [state, formAction, pending] = useActionState<CatalogueState, FormData>(
    saveCatalogueProductAction,
    {},
  );

  const list = (value?: string[]) =>
    value && value.length ? value.join(", ") : "";

  return (
    <form action={formAction} className="space-y-5">
      {product?.id ? (
        <input type="hidden" name="id" value={product.id} />
      ) : null}

      <div className="card p-5">
        <h2 className="text-sm font-bold text-fg">Details</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label" htmlFor="name">
              Product name
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={product?.name}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              minLength={10}
              rows={4}
              defaultValue={product?.description}
              className="input resize-y"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="brand">
                Brand
              </label>
              <input
                id="brand"
                name="brand"
                defaultValue={product?.brand ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="brandId">
                Brand (catalogue)
              </label>
              <select
                id="brandId"
                name="brandId"
                defaultValue={brands.find((brand) => brand.name === product?.brand)?.id ?? ""}
                className="input"
              >
                <option value="">—</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="sku">
                SKU
              </label>
              <input
                id="sku"
                name="sku"
                required
                defaultValue={product?.sku ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="categoryId">
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                required
                defaultValue={product?.categoryId ?? categories[0]?.id}
                className="input"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-bold text-fg">Pricing &amp; stock</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label" htmlFor="price">
              Price (USD)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={product ? product.price / 100 : undefined}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="compareAtPrice">
              Compare-at price
            </label>
            <input
              id="compareAtPrice"
              name="compareAtPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={
                product?.compareAtPrice ? product.compareAtPrice / 100 : undefined
              }
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="cost">
              Unit cost
            </label>
            <input
              id="cost"
              name="cost"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.cost ? product.cost / 100 : undefined}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="stock">
              Stock
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              required
              defaultValue={product?.stock ?? 0}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="lowStockThreshold">
              Low-stock threshold
            </label>
            <input
              id="lowStockThreshold"
              name="lowStockThreshold"
              type="number"
              min="0"
              defaultValue={product?.lowStockThreshold ?? 10}
              className="input"
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2.5 text-sm text-fg-muted">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={product?.featured ?? false}
                className="h-4 w-4 rounded border-line-strong text-brand-fg"
              />
              Feature on the home page
            </label>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-bold text-fg">Photos &amp; variants</h2>
        <p className="mt-1 text-xs text-fg-muted">
          Point to files inside <code>/public</code> or paste full image URLs.
          Sizes, colours and variants are comma separated.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="image">
              Main image path or URL
            </label>
            <input
              id="image"
              name="image"
              defaultValue={product?.image ?? ""}
              placeholder="/products/photos/item-1.jpg"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="gallery">
              Gallery images (comma separated)
            </label>
            <input
              id="gallery"
              name="gallery"
              defaultValue={list(product?.gallery)}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="sizes">
              Sizes
            </label>
            <input
              id="sizes"
              name="sizes"
              defaultValue={list(product?.sizes)}
              placeholder="S, M, L"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="colors">
              Colours
            </label>
            <input
              id="colors"
              name="colors"
              defaultValue={list(product?.colors)}
              placeholder="Black, Silver"
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="variants">
              Variants (JSON)
            </label>
            <input
              id="variants"
              name="variants"
              defaultValue={
                product?.variants && product.variants.length > 2
                  ? product.variants
                  : ""
              }
              placeholder='[{"name":"Black","price":129,"stock":4}]'
              className="input font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {state.error ? (
        <p className="flex items-center gap-2 rounded-xl border border-rose-200 bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger-fg">
          <AlertCircle className="h-4 w-4 shrink-0" /> {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-success-soft px-3.5 py-2.5 text-sm font-medium text-success-fg">
          <Check className="h-4 w-4 shrink-0" /> {state.success}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Saving…
          </>
        ) : (
          <>
            <Save className="h-4 w-4" /> {product?.id ? "Save changes" : "Create product"}
          </>
        )}
      </button>
    </form>
  );
}
