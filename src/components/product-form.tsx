"use client";

import { useActionState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { saveProductAction, type AdminState } from "@/lib/actions/admin";
import { useI18n } from "@/components/i18n-provider";

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
  const { t } = useI18n();
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
        <h2 className="text-sm font-bold text-fg">{t("admin.product.details")}</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label" htmlFor="name">
              {t("admin.product.name")}
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
              {t("admin.product.description")}
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
                {t("admin.product.brand")}
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
                {t("admin.product.sku")}
              </label>
              <input
                id="sku"
                name="sku"
                defaultValue={product?.sku ?? ""}
                placeholder={t("admin.product.skuPlaceholder")}
                className="input"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-bold text-fg">{t("admin.product.pricing")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="price">
              {t("admin.product.priceUsd")}
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
              {t("admin.product.comparePrice")}
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
              {t("admin.product.stock")}
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
        <h2 className="text-sm font-bold text-fg">
          {t("admin.product.organisation")}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="categoryId">
              {t("admin.product.category")}
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
          <label className="flex items-center gap-2.5 self-end pb-2.5 text-sm text-fg-muted">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={product?.featured ?? false}
              className="h-4 w-4 rounded border-line-strong text-brand-fg"
            />
            {t("admin.product.featured")}
          </label>
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
        {pending
          ? t("admin.product.saving")
          : product?.id
            ? t("admin.product.save")
            : t("admin.product.create")}
      </button>
    </form>
  );
}
