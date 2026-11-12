/**
 * Points every product at the real photography that is already downloaded in
 * public/products/photos - no network access, no re-download.
 *
 *   npm run relink:photos
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PHOTO_DIR = join(process.cwd(), "public", "products", "photos");

const files = readdirSync(PHOTO_DIR).filter((file) =>
  /\.(jpg|jpeg|png|webp)$/i.test(file),
);

/** slug -> sorted photo file names */
const bySlug = new Map();
for (const file of files) {
  const match = file.match(/^(.+?)-(\d+)-[a-f0-9]{6}\.(jpg|jpeg|png|webp)$/i);
  if (!match) continue;
  const [, slug, index] = match;
  const list = bySlug.get(slug) ?? [];
  list.push({ file, index: Number(index) });
  bySlug.set(slug, list);
}

const products = await prisma.product.findMany({
  select: { id: true, slug: true, name: true, image: true },
});

let updated = 0;
let missing = 0;

for (const product of products) {
  const photos = (bySlug.get(product.slug) ?? []).sort(
    (a, b) => a.index - b.index,
  );

  if (photos.length === 0) {
    missing += 1;
    console.log(`no photo found for ${product.slug} (${product.name})`);
    continue;
  }

  const paths = photos.map((photo) => `/products/photos/${photo.file}`);
  const isLinked = product.image === paths[0];

  if (!isLinked) {
    await prisma.product.update({
      where: { id: product.id },
      data: { image: paths[0], gallery: JSON.stringify(paths) },
    });
    updated += 1;
  }
}

console.log(
  `\n${updated} products relinked, ${products.length - updated} already correct, ${missing} without photography`,
);
await prisma.$disconnect();
