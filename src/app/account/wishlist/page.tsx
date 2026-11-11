import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ProductCard, type ProductCardData } from "@/components/product-card";

export const metadata: Metadata = {
  title: "My wishlist",
  description: "Products you have saved for later.",
};

export default async function WishlistPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/wishlist");

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.id },
    include: {
      product: { include: { category: { select: { name: true, slug: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const savedIds = new Set(items.map((item) => item.productId));

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-black tracking-tight text-ink-950">
        My wishlist
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        {items.length} {items.length === 1 ? "item" : "items"} saved for later.
      </p>

      {items.length === 0 ? (
        <div className="card mt-8 flex flex-col items-center gap-3 py-20 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 text-ink-400">
            <Heart className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-bold text-ink-900">Nothing saved yet</h2>
          <p className="max-w-sm text-sm text-ink-500">
            Tap the heart on any product to keep it here for later.
          </p>
          <Link href="/products" className="btn btn-primary mt-1">
            Find something you love
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              product={item.product as ProductCardData}
              saved={savedIds.has(item.productId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
