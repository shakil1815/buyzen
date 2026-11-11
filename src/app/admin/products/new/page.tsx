import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/product-form";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "New product",
};

export default async function NewProductPage() {
  const [categories, t] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getT(),
  ]);

  return (
    <div>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm font-semibold text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </Link>
      <h1 className="mt-3 text-2xl font-black tracking-tight text-fg-strong">
        {t("admin.product.new.title")}
      </h1>
      <p className="mt-1 text-sm text-fg-muted">{t("admin.product.new.body")}</p>

      <div className="mt-6 max-w-3xl">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
