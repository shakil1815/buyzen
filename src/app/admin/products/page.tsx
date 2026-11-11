import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { deleteProductAction } from "@/lib/actions/admin";
import { getT } from "@/lib/i18n/server";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Products",
};

export default async function AdminProductsPage(props: PageProps<"/admin/products">) {
  const searchParams = (await props.searchParams) as Record<
    string,
    string | string[] | undefined
  >;
  const created = searchParams.created === "1";
  const [t, currency] = await Promise.all([getT(), getCurrency()]);
  const rate = usdToBdtRate();

  const products = await prisma.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-fg-strong">
            {t("admin.products.title")}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {t("admin.products.count", { count: products.length })}
          </p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          <Plus className="h-4 w-4" /> {t("admin.newProduct")}
        </Link>
      </div>

      {created ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-success-soft px-4 py-2.5 text-sm font-medium text-success-fg">
          {t("admin.products.created")}
        </p>
      ) : null}

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-fg-subtle">
            <tr>
              <th className="px-4 py-3 font-semibold">
                {t("admin.products.product")}
              </th>
              <th className="px-4 py-3 font-semibold">
                {t("admin.products.category")}
              </th>
              <th className="px-4 py-3 font-semibold">
                {t("admin.products.price")}
              </th>
              <th className="px-4 py-3 font-semibold">
                {t("admin.products.stock")}
              </th>
              <th className="px-4 py-3 font-semibold">
                {t("admin.products.featured")}
              </th>
              <th className="px-4 py-3 text-right font-semibold">
                {t("common.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((product) => (
              <tr key={product.id} className="transition hover:bg-surface-2/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-3">
                      <Image
                        src={product.image}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/products/${product.slug}`}
                        className="block truncate font-medium text-fg hover:text-brand-fg"
                      >
                        {product.name}
                      </Link>
                      <p className="text-[11px] text-fg-subtle">{product.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-fg-muted">{product.category.name}</td>
                <td className="px-4 py-3 font-semibold text-fg">
                  {formatMoney(product.price, currency, rate)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`badge ${
                      product.stock === 0
                        ? "bg-danger-soft text-danger-fg"
                        : product.stock <= 15
                          ? "bg-warn-soft text-warn-fg"
                          : "bg-success-soft text-success-fg"
                    }`}
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-3 text-fg-muted">
                  {product.featured ? (
                    <span className="badge bg-brand-soft text-brand-fg">Yes</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="rounded-lg border border-line-strong p-2 text-fg-muted transition hover:bg-surface-2"
                      aria-label={t("admin.products.editProduct", {
                        name: product.name,
                      })}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <form action={deleteProductAction.bind(null, product.id)}>
                      <button
                        type="submit"
                        className="rounded-lg border border-line-strong p-2 text-fg-muted transition hover:border-rose-200 hover:bg-danger-soft hover:text-danger-fg"
                        aria-label={t("admin.products.deleteProduct", {
                          name: product.name,
                        })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
