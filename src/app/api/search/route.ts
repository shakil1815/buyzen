import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ products: [] });
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { brand: { contains: query } },
        { description: { contains: query } },
      ],
    },
    include: { category: { select: { name: true } } },
    take: 6,
    orderBy: { featured: "desc" },
  });

  return NextResponse.json({
    products: products.map((product) => ({
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category.name,
    })),
  });
}
