import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Headphones,
  Laptop,
  Camera,
  Gamepad2,
  Home,
  Watch,
  Truck,
  ShieldCheck,
  RotateCcw,
  CreditCard,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ProductCard, type ProductCardData } from "@/components/product-card";

const CATEGORY_ICONS: Record<string, typeof Headphones> = {
  audio: Headphones,
  wearables: Watch,
  computing: Laptop,
  photography: Camera,
  home: Home,
  gaming: Gamepad2,
};

export default async function HomePage() {
  const session = await getSession();

  const [categories, featured, deals, topRated, newest, savedItems] =
    await Promise.all([
      prisma.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.product.findMany({
        where: { featured: true },
        include: { category: { select: { name: true, slug: true } } },
        take: 8,
        orderBy: { createdAt: "asc" },
      }),
      prisma.product.findMany({
        where: { compareAtPrice: { not: null } },
        include: { category: { select: { name: true, slug: true } } },
        take: 4,
        orderBy: { price: "asc" },
      }),
      prisma.product.findMany({
        include: { category: { select: { name: true, slug: true } } },
        take: 4,
        orderBy: { rating: "desc" },
      }),
      prisma.product.findMany({
        include: { category: { select: { name: true, slug: true } } },
        take: 4,
        orderBy: { createdAt: "desc" },
      }),
      session
        ? prisma.wishlistItem.findMany({
            where: { userId: session.id },
            select: { productId: true },
          })
        : Promise.resolve([]),
    ]);

  const savedIds = new Set(savedItems.map((item) => item.productId));

  const heroProduct = featured[0];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink-100 bg-ink-950 text-white">
        <div
          className="pointer-events-none absolute -right-24 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand-600/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-40 left-1/3 h-[24rem] w-[24rem] rounded-full bg-fuchsia-600/20 blur-3xl"
          aria-hidden
        />

        <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="badge bg-white/10 text-brand-200">
              New season · up to 25% off
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Premium gear,
              <br />
              <span className="bg-gradient-to-r from-brand-300 to-fuchsia-300 bg-clip-text text-transparent">
                delivered fast.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-300">
              Audio, computing, gaming and home essentials hand-picked by people
              who actually use them. Free shipping over $150, 30-day returns and
              support that answers in a day.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn btn-primary px-6 py-3">
                Shop the catalogue
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/products?deals=1"
                className="btn border border-white/20 bg-white/5 px-6 py-3 text-white backdrop-blur transition hover:bg-white/10"
              >
                Today&apos;s deals
              </Link>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
              {[
                ["4.8/5", "from 2,400+ reviews"],
                ["24h", "order dispatch"],
                ["30 days", "free returns"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-2xl font-black tracking-tight">{value}</dt>
                  <dd className="mt-1 text-xs text-ink-400">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {heroProduct ? (
            <div className="relative">
              <div className="grid grid-cols-5 grid-rows-6 gap-4">
                <div className="relative col-span-3 row-span-4 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                  <Image
                    src={heroProduct.image}
                    alt={heroProduct.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 60vw, 30vw"
                    className="object-cover"
                  />
                </div>
                {featured.slice(1, 3).map((product, index) => (
                  <div
                    key={product.id}
                    className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 ${
                      index === 0
                        ? "col-span-2 row-span-3"
                        : "col-span-2 row-span-2"
                    }`}
                  >
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 40vw, 20vw"
                      className="object-cover"
                    />
                  </div>
                ))}
                <div className="col-span-3 row-span-2 flex flex-col justify-center rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-wide text-ink-400">
                    Staff pick
                  </p>
                  <p className="mt-1 text-lg font-bold">{heroProduct.name}</p>
                  <p className="mt-1 text-sm text-ink-300">
                    ★ {heroProduct.rating.toFixed(1)} · $
                    {(heroProduct.price / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Value props */}
      <section className="border-b border-ink-100 bg-white">
        <div className="container-page grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Truck,
              title: "Free shipping over $150",
              body: "Flat $9.90 below that, tracked delivery in 2-5 days.",
            },
            {
              icon: RotateCcw,
              title: "30-day returns",
              body: "Prepaid labels and a refund within days of arrival.",
            },
            {
              icon: ShieldCheck,
              title: "2-year warranty",
              body: "Every product is covered against manufacturing faults.",
            },
            {
              icon: CreditCard,
              title: "Pay your way",
              body: "Cards, Apple Pay, PayPal and buy-now-pay-later.",
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-ink-950 sm:text-3xl">
              Shop by category
            </h2>
            <p className="mt-1.5 text-sm text-ink-500">
              Six curated departments, restocked every week.
            </p>
          </div>
          <Link
            href="/products"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 sm:flex"
          >
            View everything <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug] ?? Headphones;
            return (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group card flex flex-col items-center gap-3 p-5 text-center transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-100 text-ink-700 transition group-hover:bg-brand-600 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-ink-900">
                  {category.name}
                </span>
                <span className="text-xs text-ink-400">
                  {category._count.products} products
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      <section className="bg-ink-50/60 py-16">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-ink-950 sm:text-3xl">
                Featured this week
              </h2>
              <p className="mt-1.5 text-sm text-ink-500">
                Hand-picked favourites from our buyers.
              </p>
            </div>
            <Link
              href="/products"
              className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 sm:flex"
            >
              See all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featured.slice(0, 8).map((product, index) => (
              <ProductCard
                key={product.id}
                product={product as ProductCardData}
                saved={savedIds.has(product.id)}
                priority={index < 4}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Deals */}
      {deals.length > 0 ? (
        <section className="container-page py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-ink-950 sm:text-3xl">
                Today&apos;s deals
              </h2>
              <p className="mt-1.5 text-sm text-ink-500">
                Real discounts while stocks last.
              </p>
            </div>
            <Link
              href="/products?deals=1"
              className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 sm:flex"
            >
              All deals <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {deals.map((product) => (
              <ProductCard
                key={product.id}
                product={product as ProductCardData}
                saved={savedIds.has(product.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Top rated + new */}
      <section className="container-page grid gap-14 pb-16 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-ink-950">
            Highest rated
          </h2>
          <p className="mt-1.5 text-sm text-ink-500">
            What customers rate highest right now.
          </p>
          <div className="mt-6 space-y-3">
            {topRated.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-3 transition hover:shadow-soft"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-50">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {product.name}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {product.category.name} · ★ {product.rating.toFixed(1)} (
                    {product.reviewCount})
                  </p>
                </div>
                <p className="text-sm font-bold text-ink-950">
                  ${(product.price / 100).toFixed(2)}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight text-ink-950">
            New arrivals
          </h2>
          <p className="mt-1.5 text-sm text-ink-500">
            Just landed in the warehouse.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {newest.map((product) => (
              <ProductCard
                key={product.id}
                product={product as ProductCardData}
                saved={savedIds.has(product.id)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
