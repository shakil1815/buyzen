import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { ProductFilters, SortSelect } from "@/components/product-filters";
import { categoryLabel, getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Shop all products",
  description:
    "Browse the full ShopFront catalogue of audio, wearables, computing, photography, home and gaming gear.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ProductsPage(props: PageProps<"/products">) {
  const searchParams = (await props.searchParams) as SearchParams;
  const t = await getT();

  const query = first(searchParams.q).trim();
  const category = first(searchParams.category).trim();
  const sort = first(searchParams.sort) || "featured";
  const min = Number(first(searchParams.min)) || 0;
  const max = Number(first(searchParams.max)) || 0;
  const minRating = Number(first(searchParams.rating)) || 0;
  const inStock = first(searchParams.stock) === "1";
  const deals = first(searchParams.deals) === "1";

  const where: Record<string, unknown> = {};

  if (query) {
    where.OR = [
      { name: { contains: query } },
      { description: { contains: query } },
      { brand: { contains: query } },
      { category: { name: { contains: query } } },
    ];
  }
  if (category) where.category = { slug: category };
  if (min || max) {
    where.price = {
      ...(min ? { gte: min * 100 } : {}),
      ...(max ? { lte: max * 100 } : {}),
    };
  }
  if (minRating) where.rating = { gte: minRating };
  if (inStock) where.stock = { gt: 0 };
  if (deals) where.compareAtPrice = { not: null };

  const orderBy: Record<string, unknown> = {
    featured: { featured: "desc" },
    newest: { createdAt: "desc" },
    "price-asc": { price: "asc" },
    "price-desc": { price: "desc" },
    rating: { rating: "desc" },
    name: { name: "asc" },
  }[sort] ?? { featured: "desc" };

  const [products, categories, session] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: { category: { select: { name: true, slug: true } } },
    }),
    prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    }),
    getSession(),
  ]);

  const savedItems = session
    ? await prisma.wishlistItem.findMany({
        where: { userId: session.id },
        select: { productId: true },
      })
    : [];
  const savedIds = new Set(savedItems.map((item) => item.productId));

  const heading = query
    ? t("products.searchTitle", { query })
    : category
      ? categoryLabel(t, category, categories.find((item) => item.slug === category)?.name ?? category)
      : deals
        ? t("nav.deals")
        : t("products.title");

  return (
    <div className="container-page py-10">
      <nav className="flex items-center gap-2 text-xs text-fg-muted">
        <Link href="/" className="hover:text-brand-fg">
          {t("common.home")}
        </Link>
        <span>/</span>
        <span className="text-fg">{heading}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-fg-strong">
            {heading}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {t("products.count", { count: products.length })}
            {query ? ` — “${query}”` : ""}
          </p>
        </div>
        <Suspense fallback={null}>
          <SortSelect />
        </Suspense>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
          <ProductFilters
            categories={categories.map((item) => ({
              id: item.id,
              name: item.name,
              slug: item.slug,
              count: item._count.products,
            }))}
          />
        </Suspense>

        <div>
          {products.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 py-20 text-center">
              <PackageSearch className="h-10 w-10 text-fg-subtle" />
              <h2 className="text-lg font-bold text-fg">
                {t("products.empty.title")}
              </h2>
              <p className="max-w-sm text-sm text-fg-muted">
                {t("products.empty.body")}
              </p>
              <Link href="/products" className="btn btn-primary mt-2">
                {t("products.empty.reset")}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product as ProductCardData}
                  saved={savedIds.has(product.id)}
                  priority={index < 4}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
