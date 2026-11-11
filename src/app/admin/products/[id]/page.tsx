import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/product-form";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Edit product",
};

export default async function EditProductPage(
  props: PageProps<"/admin/products/[id]">,
) {
  const { id } = await props.params;

  const [product, categories, t] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getT(),
  ]);

  if (!product) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 text-sm font-semibold text-fg-muted hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </Link>
        <Link
          href={`/products/${product.slug}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-fg hover:text-brand-600"
        >
          {t("admin.product.viewInStore")} <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <h1 className="mt-3 text-2xl font-black tracking-tight text-fg-strong">
        {t("admin.product.edit.title")}
      </h1>
      <p className="mt-1 text-sm text-fg-muted">
        {product.name} · {product.sku}
      </p>

      <div className="mt-6 max-w-3xl">
        <ProductForm
          categories={categories}
          product={{
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            stock: product.stock,
            brand: product.brand,
            sku: product.sku,
            categoryId: product.categoryId,
            featured: product.featured,
          }}
        />
      </div>
    </div>
  );
}
