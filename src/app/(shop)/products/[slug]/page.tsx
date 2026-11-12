import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  Box,
  RotateCcw,
  Truck,
  User,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDate, formatMoney, discountPercent } from "@/lib/format";
import { RatingStars } from "@/components/rating-stars";
import { AddToCart } from "@/components/add-to-cart";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductGallery } from "@/components/product-gallery";
import { ReviewForm } from "@/components/review-form";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { categoryLabel, getDateLocale, getT } from "@/lib/i18n/server";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    select: { slug: true },
    take: 100,
  });
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(
  props: PageProps<"/products/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 155),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 155),
      images: [product.image],
    },
  };
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: { select: { name: true, slug: true } },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) notFound();

  const [session, t, currency, dateLocale] = await Promise.all([
    getSession(),
    getT(),
    getCurrency(),
    getDateLocale(),
  ]);
  const rate = usdToBdtRate();

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      NOT: { id: product.id },
    },
    include: { category: { select: { name: true, slug: true } } },
    take: 4,
  });

  const gallery: string[] = (() => {
    try {
      const parsed = JSON.parse(product.gallery) as string[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [product.image];
    } catch {
      return [product.image];
    }
  })();

  const off = discountPercent(product.price, product.compareAtPrice);
  const existingReview = session
    ? product.reviews.find((review) => review.userId === session.id)
    : undefined;

  const saved = session
    ? !!(await prisma.wishlistItem.findUnique({
        where: {
          userId_productId: { userId: session.id, productId: product.id },
        },
      }))
    : false;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: gallery,
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand ?? "BuyZen" },
    offers: {
      "@type": "Offer",
      price: (product.price / 100).toFixed(2),
      priceCurrency: "USD",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    aggregateRating: product.reviewCount
      ? {
          "@type": "AggregateRating",
          ratingValue: product.rating,
          reviewCount: product.reviewCount,
        }
      : undefined,
  };

  return (
    <div className="container-page py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
        <Link href="/" className="hover:text-brand-fg">
          {t("common.home")}
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-brand-fg">
          {t("common.shop")}
        </Link>
        <span>/</span>
        <Link
          href={`/products?category=${product.category.slug}`}
          className="hover:text-brand-fg"
        >
          {categoryLabel(t, product.category.slug, product.category.name)}
        </Link>
        <span>/</span>
        <span className="text-fg">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductGallery images={gallery} alt={product.name} />

        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-brand-fg"
            >
              {categoryLabel(t, product.category.slug, product.category.name)}
            </Link>
            {product.brand ? <span>• {product.brand}</span> : null}
          </div>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-fg-strong sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <RatingStars
              rating={product.rating}
              count={product.reviewCount}
              size="md"
            />
            {product.reviewCount > 0 ? (
              <a href="#reviews" className="text-xs font-semibold text-brand-fg">
                {t("product.readReviews")}
              </a>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <p className="text-4xl font-black tracking-tight text-fg-strong">
              {formatMoney(product.price, currency, rate)}
            </p>
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <>
                <p className="text-lg text-fg-subtle line-through">
                  {formatMoney(product.compareAtPrice, currency, rate)}
                </p>
                <span className="badge bg-rose-500 text-white">-{off}%</span>
              </>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-fg-muted">
            {t("product.orPay", {
              amount: formatMoney(Math.round(product.price / 4), currency, rate),
            })}
          </p>

          <p className="mt-6 max-w-xl text-sm leading-relaxed text-fg-muted">
            {product.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <AddToCart
              productId={product.id}
              disabled={product.stock === 0}
              max={Math.max(product.stock, 1)}
              label={
                product.stock === 0
                  ? t("product.outOfStock")
                  : t("product.addToCart")
              }
            />
            <WishlistButton
              productId={product.id}
              slug={product.slug}
              saved={saved}
            />
          </div>

          <p className="mt-3 text-xs text-fg-muted">
            {product.stock > 0 ? (
              <>
                <span className="font-semibold text-success-fg">
                  {t("product.inStock")}
                </span>{" "}
                — {t("product.readyToShip", { count: product.stock })}
              </>
            ) : (
              <span className="font-semibold text-danger-fg">
                {t("product.currentlyOut")}
              </span>
            )}
          </p>

          <dl className="mt-8 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
            {[
              {
                icon: Truck,
                title: t("product.freeShipping"),
                body: t("product.freeShippingBody"),
              },
              {
                icon: RotateCcw,
                title: t("product.returns"),
                body: t("product.returnsBody"),
              },
              {
                icon: BadgeCheck,
                title: t("product.warranty"),
                body: t("product.warrantyBody"),
              },
              {
                icon: Box,
                title: t("product.skuLabel", { sku: product.sku }),
                body: t("product.addedOn", { date: formatDate(product.createdAt, dateLocale) }),
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-fg" />
                <div>
                  <dt className="text-xs font-semibold text-fg">{item.title}</dt>
                  <dd className="text-[11px] text-fg-muted">{item.body}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Reviews */}
      <section id="reviews" className="mt-16 scroll-mt-32">
        <h2 className="text-2xl font-black tracking-tight text-fg-strong">
          {t("product.reviewsTitle")}
        </h2>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-4">
            {product.reviews.length === 0 ? (
              <p className="card p-6 text-sm text-fg-muted">
                {t("product.noReviews")}
              </p>
            ) : null}

            {product.reviews.map((review) => (
              <article key={review.id} className="card p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-fg">
                      {review.user.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-fg">
                        {review.user.name}
                      </p>
                      <p className="text-[11px] text-fg-subtle">
                        {t("product.verifiedPurchase")} ·{" "}
                        {formatDate(review.createdAt, dateLocale)}
                      </p>
                    </div>
                  </div>
                  <RatingStars rating={review.rating} />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-fg">
                  {review.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-fg-muted">
                  {review.body}
                </p>
              </article>
            ))}
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex items-center gap-4">
                <p className="text-4xl font-black text-fg-strong">
                  {product.rating > 0 ? product.rating.toFixed(1) : "—"}
                </p>
                <div>
                  <RatingStars rating={product.rating} />
                  <p className="mt-1 text-xs text-fg-muted">
                    {product.reviewCount} review
                    {product.reviewCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = product.reviews.filter(
                    (review) => review.rating === star,
                  ).length;
                  const percent = product.reviewCount
                    ? (count / product.reviewCount) * 100
                    : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-[11px]">
                      <span className="w-3 text-fg-muted">{star}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                        <span
                          className="block h-full rounded-full bg-amber-400"
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                      <span className="w-6 text-right text-fg-subtle">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <ReviewForm
              productId={product.id}
              signedIn={!!session}
              canReview={!existingReview}
            />

            <div className="card flex items-start gap-3 p-4 text-xs text-fg-muted">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" />
              {t("product.reviewOnlyBuyers")}
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="mt-16">
          <h2 className="text-2xl font-black tracking-tight text-fg-strong">
            {t("product.related")}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item as ProductCardData}
                saved={false}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
