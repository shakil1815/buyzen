import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ProductCard, type ProductCardData } from "@/components/product-card";

export default function Loading() {
  return (
    <div className="container-page py-10">
      <div className="skeleton h-8 w-48 rounded-lg" />
      <div className="skeleton mt-3 h-4 w-72 rounded" />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="skeleton aspect-square rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function ProductGridFallback() {
  return (
    <Suspense fallback={null}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton aspect-square rounded-2xl" />
        ))}
      </div>
    </Suspense>
  );
}

export async function FeaturedProducts() {
  const products = await prisma.product.findMany({
    where: { featured: true },
    include: { category: { select: { name: true, slug: true } } },
    take: 4,
  });

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product as ProductCardData} />
      ))}
    </div>
  );
}
