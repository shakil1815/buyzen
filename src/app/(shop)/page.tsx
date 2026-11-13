import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Gamepad2,
  Headphones,
  Home as HomeIcon,
  Laptop,
  Truck,
  ShieldCheck,
  RotateCcw,
  CreditCard,
  Watch,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { categoryLabel, getT } from "@/lib/i18n/server";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";
import { formatMoney } from "@/lib/format";

const CATEGORY_ICONS: Record<string, typeof Headphones> = {
  audio: Headphones,
  wearables: Watch,
  computing: Laptop,
  photography: Camera,
  home: HomeIcon,
  gaming: Gamepad2,
};

export default async function HomePage() {
  const [session, t, currency] = await Promise.all([
    getSession(),
    getT(),
    getCurrency(),
  ]);
  const rate = usdToBdtRate();

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
      <section className="relative overflow-hidden border-b border-line bg-ink-950 text-white">
        <div
          className="pointer-events-none absolute -right-24 -top-32 h-[30rem] w-[30rem] rounded-full bg-brand-600/35 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-48 left-1/4 h-[26rem] w-[26rem] rounded-full bg-fuchsia-600/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.35) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
          }}
          aria-hidden
        />

        <div className="container-page relative grid min-w-0 items-center gap-14 overflow-hidden py-12 sm:py-16 lg:grid-cols-2 lg:overflow-visible lg:py-24">
          <div>
            <span className="badge bg-white/10 text-brand-200 ring-1 ring-white/10">
              {t("home.hero.badge")}
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              {t("home.hero.title1")}
              <br />
              <span className="bg-gradient-to-r from-brand-300 to-fuchsia-300 bg-clip-text text-transparent">
                {t("home.hero.title2")}
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-300">
              {t("home.hero.body")}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn btn-primary px-6 py-3">
                {t("home.hero.cta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/products?deals=1"
                className="btn border border-white/20 bg-white/5 px-6 py-3 text-white backdrop-blur transition hover:bg-white/10"
              >
                {t("home.hero.ctaDeals")}
              </Link>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
              {[
                [t("home.hero.stat1"), t("home.hero.stat1Label")],
                [t("home.hero.stat2"), t("home.hero.stat2Label")],
                [t("home.hero.stat3"), t("home.hero.stat3Label")],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-2xl font-black tracking-tight">{value}</dt>
                  <dd className="mt-1 text-xs text-ink-400">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {heroProduct ? (
            <div className="relative min-w-0">
              <div className="grid min-w-0 grid-cols-2 grid-rows-[repeat(6,minmax(0,1fr))] gap-3 sm:grid-cols-5 sm:grid-rows-6 sm:gap-4">
                <div className="relative col-span-2 row-span-3 min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lift sm:col-span-3 sm:row-span-4">
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
                    className={`relative min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5 ${
                      index === 0
                        ? "col-span-1 row-span-2 sm:col-span-2 sm:row-span-3"
                        : "col-span-1 row-span-2 sm:col-span-2 sm:row-span-2"
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
                <div className="col-span-2 row-span-1 flex min-w-0 flex-col justify-center rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:col-span-3 sm:row-span-2 sm:p-5">
                  <p className="text-xs uppercase tracking-wide text-ink-400">
                    {t("home.hero.staffPick")}
                  </p>
                  <p className="mt-1 text-lg font-bold">{heroProduct.name}</p>
                  <p className="mt-1 text-sm text-ink-300">
                    ★ {heroProduct.rating.toFixed(1)} ·{" "}
                    {formatMoney(heroProduct.price, currency, rate)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Value props */}
      <section className="border-b border-line bg-surface">
        <div className="container-page grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Truck,
              title: t("home.value1.title"),
              body: t("home.value1.body"),
            },
            {
              icon: RotateCcw,
              title: t("home.value2.title"),
              body: t("home.value2.body"),
            },
            {
              icon: ShieldCheck,
              title: t("home.value3.title"),
              body: t("home.value3.body"),
            },
            {
              icon: CreditCard,
              title: t("home.value4.title"),
              body: t("home.value4.body"),
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-fg">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-fg">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-16">
        <SectionHeading
          title={t("home.categories.title")}
          body={t("home.categories.body")}
          href="/products"
          linkLabel={t("common.viewAll")}
        />

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug] ?? Headphones;
            return (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group card flex flex-col items-center gap-3 p-5 text-center transition duration-200 hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-3 text-fg transition group-hover:bg-brand-600 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-fg">
                  {categoryLabel(t, category.slug, category.name)}
                </span>
                <span className="text-xs text-fg-subtle">
                  {t("home.categories.products", {
                    count: category._count.products,
                  })}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      <section className="bg-surface-2 py-16">
        <div className="container-page">
          <SectionHeading
            title={t("home.featured.title")}
            body={t("home.featured.body")}
            href="/products"
            linkLabel={t("common.seeAll")}
          />

          <div className="mt-8 grid min-w-0 grid-cols-2 gap-4 lg:grid-cols-4">
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
          <SectionHeading
            title={t("home.deals.title")}
            body={t("home.deals.body")}
            href="/products?deals=1"
            linkLabel={t("home.deals.all")}
          />

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
      <section className="container-page grid min-w-0 gap-14 pb-16 lg:grid-cols-2">
        <div className="min-w-0">
          <h2 className="text-2xl font-black tracking-tight text-fg-strong">
            {t("home.topRated.title")}
          </h2>
          <p className="mt-1.5 text-sm text-fg-muted">
            {t("home.topRated.body")}
          </p>
          <div className="mt-6 space-y-3">
            {topRated.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="flex min-w-0 items-center gap-4 rounded-2xl border border-line bg-surface p-3 transition hover:border-brand-200 hover:shadow-soft"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-fg">
                    {product.name}
                  </p>
                  <p className="mt-0.5 text-xs text-fg-muted">
                    {categoryLabel(t, product.category.slug, product.category.name)}{" "}
                    · ★ {product.rating.toFixed(1)} ({product.reviewCount})
                  </p>
                </div>
                <p className="text-sm font-bold text-fg-strong">
                  {formatMoney(product.price, currency, rate)}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <h2 className="text-2xl font-black tracking-tight text-fg-strong">
            {t("home.new.title")}
          </h2>
          <p className="mt-1.5 text-sm text-fg-muted">{t("home.new.body")}</p>
          <div className="mt-6 grid min-w-0 grid-cols-2 gap-4">
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

function SectionHeading({
  title,
  body,
  href,
  linkLabel,
}: {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-fg">
          <span className="h-px w-6 bg-brand-400" />
          BuyZen
        </span>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-fg-strong sm:text-3xl">
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-fg-muted">{body}</p>
      </div>
      <Link
        href={href}
        className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand-fg hover:gap-2 sm:flex"
      >
        {linkLabel} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
