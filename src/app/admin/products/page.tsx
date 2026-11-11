import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { deleteProductAction } from "@/lib/actions/admin";

export const metadata: Metadata = {
  title: "Products",
};

export default async function AdminProductsPage(props: PageProps<"/admin/products">) {
  const searchParams = (await props.searchParams) as Record<
    string,
    string | string[] | undefined
  >;
  const created = searchParams.created === "1";

  const products = await prisma.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink-950">
            Products
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {products.length} products in the catalogue.
          </p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          <Plus className="h-4 w-4" /> New product
        </Link>
      </div>

      {created ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          Product created and published to the storefront.
        </p>
      ) : null}

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Featured</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {products.map((product) => (
              <tr key={product.id} className="transition hover:bg-ink-50/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-ink-100">
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
                        className="block truncate font-medium text-ink-900 hover:text-brand-600"
                      >
                        {product.name}
                      </Link>
                      <p className="text-[11px] text-ink-400">{product.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-600">{product.category.name}</td>
                <td className="px-4 py-3 font-semibold text-ink-900">
                  {formatMoney(product.price)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`badge ${
                      product.stock === 0
                        ? "bg-rose-50 text-rose-700"
                        : product.stock <= 15
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-600">
                  {product.featured ? (
                    <span className="badge bg-brand-50 text-brand-700">Yes</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="rounded-lg border border-ink-200 p-2 text-ink-600 transition hover:bg-ink-50"
                      aria-label={`Edit ${product.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <form action={deleteProductAction.bind(null, product.id)}>
                      <button
                        type="submit"
                        className="rounded-lg border border-ink-200 p-2 text-ink-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Delete ${product.name}`}
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
