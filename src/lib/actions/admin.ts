"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { slugify } from "@/lib/format";

export type AdminState = { error?: string; success?: string };

const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(10, "Add a longer description"),
  price: z.coerce.number().min(1, "Price must be positive"),
  compareAtPrice: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  brand: z.string().optional(),
  sku: z.string().optional(),
  categoryId: z.string().min(1, "Pick a category"),
  featured: z.coerce.boolean().optional(),
  image: z.string().optional(),
  gallery: z.string().optional(),
});

function normaliseImage(value?: string) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}

function toCents(value: number) {
  return Math.round(value * 100);
}

export async function saveProductAction(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || undefined,
    stock: formData.get("stock"),
    brand: formData.get("brand") || undefined,
    sku: formData.get("sku") || undefined,
    categoryId: formData.get("categoryId"),
    featured: formData.get("featured") === "on",
    image: formData.get("image") || undefined,
    gallery: formData.get("gallery") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the product details." };
  }

  const gallery = (parsed.data.gallery ?? "")
    .split(",")
    .map((entry) => normaliseImage(entry))
    .filter((entry): entry is string => Boolean(entry));

  const data = {
    name: parsed.data.name,
    description: parsed.data.description,
    price: toCents(parsed.data.price),
    compareAtPrice: parsed.data.compareAtPrice
      ? toCents(parsed.data.compareAtPrice)
      : null,
    stock: parsed.data.stock,
    brand: parsed.data.brand ?? null,
    featured: parsed.data.featured ?? false,
    categoryId: parsed.data.categoryId,
    ...(gallery.length > 0 ? { gallery: JSON.stringify(gallery) } : {}),
  };

  const image = normaliseImage(parsed.data.image);

  if (id) {
    await prisma.product.update({
      where: { id },
      data: { ...data, ...(image ? { image } : {}) },
    });
    revalidatePath("/admin/products");
    revalidatePath("/products");
    return { success: "Product updated." };
  }

  const slug = `${slugify(parsed.data.name)}-${Date.now().toString(36).slice(-4)}`;
  const sku =
    parsed.data.sku?.trim() ||
    `SF-${slug.slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase().slice(-4)}`;

  await prisma.product.create({
    data: {
      ...data,
      slug,
      sku,
      image: image ?? "/products/placeholder.svg",
      gallery:
        gallery.length > 0
          ? JSON.stringify(gallery)
          : JSON.stringify([image ?? "/products/placeholder.svg"]),
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products?created=1");
}

export async function deleteProductAction(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function updateOrderStatusAction(id: string, status: string) {
  await requireAdmin();
  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");
}

export async function createCouponAction(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const type = String(formData.get("type") ?? "PERCENT");
  const value = Number(formData.get("value") ?? 0);
  const minSubtotal = toCents(Number(formData.get("minSubtotal") ?? 0));

  if (!code) return { error: "A code is required." };
  if (!Number.isFinite(value) || value <= 0) return { error: "Enter a discount value." };

  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) return { error: "That code already exists." };

  await prisma.coupon.create({
    data: {
      code,
      type: type === "FIXED" ? "FIXED" : "PERCENT",
      value: type === "FIXED" ? toCents(value) : Math.round(value),
      minSubtotal,
      description: String(formData.get("description") ?? "") || null,
    },
  });

  revalidatePath("/admin/coupons");
  return { success: `Coupon ${code} created.` };
}

export async function toggleCouponAction(id: string) {
  await requireAdmin();
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) return;
  await prisma.coupon.update({
    where: { id },
    data: { active: !coupon.active },
  });
  revalidatePath("/admin/coupons");
}
