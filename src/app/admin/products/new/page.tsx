import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "New product",
};

export default async function NewProductPage() {
  await requirePermission("products.manage");

  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm font-semibold text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>
      <h1 className="mt-3 text-2xl font-black tracking-tight text-fg-strong">
        New product
      </h1>
      <p className="mt-1 text-sm text-fg-muted">
        Products go live on the storefront as soon as they are saved.
      </p>

      <div className="mt-6 max-w-3xl">
        <ProductForm categories={categories} brands={brands} />
      </div>
    </div>
  );
}
