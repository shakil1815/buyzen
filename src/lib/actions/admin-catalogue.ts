"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { toCsv } from "@/lib/csv";

export type CatalogueState = { error?: string; success?: string };

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).optional(),
  cost: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
  sku: z.string().min(1),
  brand: z.string().optional(),
  brandId: z.string().optional(),
  categoryId: z.string().min(1),
  image: z.string().optional(),
  gallery: z.string().optional(),
  sizes: z.string().optional(),
  colors: z.string().optional(),
  variants: z.string().optional(),
  featured: z.coerce.boolean().optional(),
});

const parseList = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

export async function saveCatalogueProductAction(
  _state: CatalogueState,
  formData: FormData,
): Promise<CatalogueState> {
  const admin = await assertPermission("products.manage");
  const id = formData.get("id")?.toString() || null;

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || undefined,
    cost: formData.get("cost") || undefined,
    stock: formData.get("stock"),
    lowStockThreshold: formData.get("lowStockThreshold") || 10,
    sku: formData.get("sku"),
    brand: formData.get("brand") || undefined,
    brandId: formData.get("brandId") || undefined,
    categoryId: formData.get("categoryId"),
    image: formData.get("image") || undefined,
    gallery: formData.get("gallery") || undefined,
    sizes: formData.get("sizes") || undefined,
    colors: formData.get("colors") || undefined,
    variants: formData.get("variants") || undefined,
    featured: formData.get("featured") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the product" };
  }

  const data = parsed.data;
  const gallery = parseList(data.gallery);
  const payload = {
    name: data.name,
    description: data.description,
    price: Math.round(data.price * 100),
    compareAtPrice: data.compareAtPrice
      ? Math.round(data.compareAtPrice * 100)
      : null,
    cost: data.cost ? Math.round(data.cost * 100) : null,
    stock: data.stock,
    lowStockThreshold: data.lowStockThreshold,
    sku: data.sku,
    brand: data.brand ?? null,
    brandId: data.brandId || null,
    categoryId: data.categoryId,
    featured: data.featured,
    sizes: JSON.stringify(parseList(data.sizes)),
    colors: JSON.stringify(parseList(data.colors)),
    variants: data.variants ?? "[]",
    ...(gallery.length > 0 ? { gallery: JSON.stringify(gallery) } : {}),
    ...(data.image ? { image: data.image } : {}),
  };

  if (id) {
    await prisma.product.update({ where: { id }, data: payload });
    await audit({
      actor: admin,
      action: "product.update",
      entity: "Product",
      entityId: id,
      meta: { sku: data.sku },
    });
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/admin/products");
    return { success: "Product saved" };
  }

  const slug = `${data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${Date.now().toString(36).slice(-4)}`;

  const created = await prisma.product.create({
    data: {
      ...payload,
      slug,
      image: data.image || "/products/placeholder.svg",
      gallery: JSON.stringify(
        gallery.length > 0 ? gallery : [data.image || "/products/placeholder.svg"],
      ),
    },
  });

  await audit({
    actor: admin,
    action: "product.create",
    entity: "Product",
    entityId: created.id,
    meta: { sku: data.sku },
  });

  revalidatePath("/admin/products");
  redirect("/admin/products?created=1");
}

export async function adjustStockAction(
  productId: string,
  delta: number,
  reason: string,
) {
  const admin = await assertPermission("inventory.manage");

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, stock: true, lowStockThreshold: true },
  });
  if (!product) return { ok: false, message: "Product not found" };

  const next = Math.max(0, product.stock + delta);
  await prisma.product.update({ where: { id: productId }, data: { stock: next } });

  if (next <= product.lowStockThreshold) {
    await notify({
      type: "stock.low",
      title: `Low stock: ${product.name}`,
      body: `${next} units left (threshold ${product.lowStockThreshold})`,
      link: "/admin/inventory",
    });
  }

  await audit({
    actor: admin,
    action: "inventory.adjust",
    entity: "Product",
    entityId: productId,
    meta: { delta, reason, from: product.stock, to: next },
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  return { ok: true, message: `Stock updated to ${next}` };
}

export async function setLowStockThresholdAction(
  productId: string,
  threshold: number,
) {
  const admin = await assertPermission("inventory.manage");

  await prisma.product.update({
    where: { id: productId },
    data: { lowStockThreshold: Math.max(0, Math.round(threshold)) },
  });

  await audit({
    actor: admin,
    action: "inventory.threshold",
    entity: "Product",
    entityId: productId,
    meta: { threshold },
  });

  revalidatePath("/admin/inventory");
  return { ok: true, message: "Threshold saved" };
}

export async function saveBrandAction(
  _state: CatalogueState,
  formData: FormData,
): Promise<CatalogueState> {
  const admin = await assertPermission("products.manage");
  const name = formData.get("name")?.toString().trim();
  if (!name) return { error: "Brand name is required" };

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  await prisma.brand.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  });

  await audit({ actor: admin, action: "brand.save", entity: "Brand", meta: { name } });
  revalidatePath("/admin/products");
  return { success: "Brand saved" };
}

/** Imports products from a CSV payload (name, sku, price, stock, category). */
export async function importProductsAction(
  _state: CatalogueState,
  formData: FormData,
): Promise<CatalogueState> {
  const admin = await assertPermission("products.import");

  const payload = formData.get("csv")?.toString() ?? "";
  const lines = payload
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return { error: "Paste a CSV with a header row and at least one product" };
  }

  const header = lines[0]
    .split(",")
    .map((column) => column.trim().toLowerCase());
  const required = ["name", "sku", "price", "stock", "category"];
  const missing = required.filter((column) => !header.includes(column));
  if (missing.length > 0) {
    return { error: `Missing columns: ${missing.join(", ")}` };
  }

  const categories = await prisma.category.findMany({
    select: { id: true, slug: true, name: true },
  });

  let imported = 0;
  for (const line of lines.slice(1)) {
    const cells = line.split(",").map((cell) => cell.trim());
    const row: Record<string, string> = {};
    header.forEach((column, index) => {
      row[column] = cells[index] ?? "";
    });

    const category =
      categories.find(
        (item) =>
          item.slug === row.category?.toLowerCase() ||
          item.name.toLowerCase() === row.category?.toLowerCase(),
      ) ?? categories[0];
    if (!category) continue;

    const slug = `${row.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}-${Date.now().toString(36).slice(-4)}`;

    await prisma.product.upsert({
      where: { sku: row.sku },
      update: {
        name: row.name,
        price: Math.round(Number(row.price || 0) * 100),
        stock: Number(row.stock || 0),
        categoryId: category.id,
      },
      create: {
        name: row.name,
        slug,
        sku: row.sku,
        description:
          row.description ??
          `${row.name} imported into the ShopFront catalogue.`,
        price: Math.round(Number(row.price || 0) * 100),
        stock: Number(row.stock || 0),
        categoryId: category.id,
        image: "/products/placeholder.svg",
        gallery: JSON.stringify(["/products/placeholder.svg"]),
      },
    });
    imported += 1;
  }

  await audit({
    actor: admin,
    action: "product.import",
    entity: "Product",
    meta: { imported },
  });

  revalidatePath("/admin/products");
  return { success: `${imported} product${imported === 1 ? "" : "s"} imported` };
}

export async function exportProductsCsv() {
  await assertPermission("products.import");
  const products = await prisma.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  return toCsv(products, [
    { key: "name", label: "Name", value: (row) => row.name },
    { key: "sku", label: "SKU", value: (row) => row.sku },
    { key: "brand", label: "Brand", value: (row) => row.brand ?? "" },
    { key: "category", label: "Category", value: (row) => row.category.name },
    {
      key: "price",
      label: "Price (USD)",
      value: (row) => (row.price / 100).toFixed(2),
    },
    {
      key: "compareAtPrice",
      label: "Compare at (USD)",
      value: (row) =>
        row.compareAtPrice ? (row.compareAtPrice / 100).toFixed(2) : "",
    },
    { key: "cost", label: "Cost (USD)", value: (row) => (row.cost ?? 0) / 100 },
    { key: "stock", label: "Stock", value: (row) => row.stock },
    {
      key: "threshold",
      label: "Low stock threshold",
      value: (row) => row.lowStockThreshold,
    },
    { key: "featured", label: "Featured", value: (row) => (row.featured ? "yes" : "no") },
  ]);
}
