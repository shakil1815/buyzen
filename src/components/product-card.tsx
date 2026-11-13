import Link from "next/link";
import { Flame } from "lucide-react";
import { RatingStars } from "@/components/rating-stars";
import { AddToCart } from "@/components/add-to-cart";
import { WishlistButton } from "@/components/wishlist-button";
import { discountPercent, formatMoney } from "@/lib/format";
import { categoryLabel, getT } from "@/lib/i18n/server";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";
import { ProductImage } from "@/components/product-image";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  rating: number;
  reviewCount: number;
  brand: string | null;
  stock: number;
  category: { name: string; slug: string };
};

export async function ProductCard({
  product,
  saved = false,
  priority = false,
}: {
  product: ProductCardData;
  saved?: boolean;
  priority?: boolean;
}) {
  const [t, currency] = await Promise.all([getT(), getCurrency()]);
  const rate = usdToBdtRate();
  const off = discountPercent(product.price, product.compareAtPrice);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative aspect-square overflow-hidden bg-surface-2">
        <Link
          href={`/products/${product.slug}`}
          className="relative block h-full w-full"
        >
          <ProductImage
            src={product.image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-2 transition duration-300 group-hover:scale-[1.04] sm:p-3"
          />
        </Link>

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {off ? (
            <span className="badge bg-rose-500 text-white">-{off}%</span>
          ) : null}
          {product.stock <= 10 && product.stock > 0 ? (
            <span className="badge bg-amber-400 text-ink-950">
              <Flame className="h-3 w-3" />
              {t("product.onlyLeft", { count: product.stock })}
            </span>
          ) : null}
          {product.stock === 0 ? (
            <span className="badge bg-ink-900 text-white">
              {t("product.outOfStock")}
            </span>
          ) : null}
        </div>

        <div className="absolute right-3 top-3 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <WishlistButton
            productId={product.id}
            slug={product.slug}
            saved={saved}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
          <span>{categoryLabel(t, product.category.slug, product.category.name)}</span>
          {product.brand ? <span>{product.brand}</span> : null}
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-fg">
          <Link href={`/products/${product.slug}`} className="hover:text-brand-fg">
            {product.name}
          </Link>
        </h3>

        <RatingStars rating={product.rating} count={product.reviewCount} />

        <div className="mt-auto flex items-end justify-between gap-1 pt-2 sm:gap-2">
          <div>
            <p className="text-base font-bold tracking-tight text-fg-strong sm:text-lg">
              {formatMoney(product.price, currency, rate)}
            </p>
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <p className="text-xs text-fg-subtle line-through">
                {formatMoney(product.compareAtPrice, currency, rate)}
              </p>
            ) : null}
          </div>
          <AddToCart
            productId={product.id}
            disabled={product.stock === 0}
            max={Math.max(product.stock, 1)}
            label={t("product.add")}
            compact
          />
        </div>
      </div>
    </article>
  );
}
