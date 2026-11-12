import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";

const prisma = new PrismaClient();
const products = await prisma.product.findMany({
  select: { slug: true, image: true, gallery: true },
});

let missing = 0;
for (const product of products) {
  const paths = [product.image, ...JSON.parse(product.gallery || "[]")];
  for (const path of new Set(paths)) {
    if (!existsSync(`public${path}`)) {
      console.log("MISSING:", product.slug, path);
      missing += 1;
    }
  }
}
console.log(`checked ${products.length} products, ${missing} missing files`);
await prisma.$disconnect();
