"use client";

import { useActionState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { saveProductAction, type AdminState } from "@/lib/actions/admin";

export type ProductFormValues = {
  id?: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  brand: string | null;
  sku: string | null;
  categoryId: string;
  featured: boolean;
};

export function ProductForm({
  categories,
  product,
}: {
  categories: { id: string; name: string }[];
  product?: ProductFormValues;
}) {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(
    saveProductAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      {product?.id ? (
        <input type="hidden" name="id" value={product.id} />
      ) : null}

      <div className="card p-5">
        <h2 className="text-sm font-bold text-ink-900">Details</h2>
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
              <label className="label" htmlFor="sku">
                SKU
              </label>
              <input
                id="sku"
                name="sku"
                defaultValue={product?.sku ?? ""}
                placeholder="Auto-generated"
                className="input"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-bold text-ink-900">Pricing &amp; stock</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
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
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-bold text-ink-900">Organisation</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
          <label className="flex items-center gap-2.5 self-end pb-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={product?.featured ?? false}
              className="h-4 w-4 rounded border-ink-300 text-brand-600"
            />
            Feature on the home page
          </label>
        </div>
      </div>

      {state.error ? (
        <p className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4 shrink-0" /> {state.success}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : product?.id ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}
