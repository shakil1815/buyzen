"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import { audit } from "@/lib/audit";

export type GrowthState = { error?: string; success?: string };

/* ------------------------------ banners ------------------------------ */

export async function saveBannerAction(
  _state: GrowthState,
  formData: FormData,
): Promise<GrowthState> {
  const admin = await assertPermission("marketing.manage");

  const title = formData.get("title")?.toString().trim();
  if (!title) return { error: "Banner title is required" };

  const data = {
    title,
    subtitle: formData.get("subtitle")?.toString() || null,
    body: formData.get("body")?.toString() || null,
    image: formData.get("image")?.toString() || null,
    link: formData.get("link")?.toString() || null,
    position: formData.get("position")?.toString() || "home",
    active: formData.get("active") === "on",
  };

  const id = formData.get("id")?.toString();
  if (id) {
    await prisma.banner.update({ where: { id }, data });
  } else {
    await prisma.banner.create({ data });
  }

  await audit({ actor: admin, action: "banner.save", entity: "Banner", meta: data });
  revalidatePath("/admin/marketing");
  return { success: "Banner saved" };
}

export async function toggleBannerAction(id: string) {
  const admin = await assertPermission("marketing.manage");
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) return { ok: false, message: "Banner not found" };
  await prisma.banner.update({ where: { id }, data: { active: !banner.active } });
  await audit({
    actor: admin,
    action: "banner.toggle",
    entity: "Banner",
    entityId: id,
  });
  revalidatePath("/admin/marketing");
  return { ok: true, message: "Banner updated" };
}

/* ---------------------------- flash sales ---------------------------- */

export async function saveFlashSaleAction(
  _state: GrowthState,
  formData: FormData,
): Promise<GrowthState> {
  const admin = await assertPermission("marketing.manage");

  const name = formData.get("name")?.toString().trim();
  const startsAt = formData.get("startsAt")?.toString();
  const endsAt = formData.get("endsAt")?.toString();
  const discount = Number(formData.get("discount") ?? 0);

  if (!name || !startsAt || !endsAt) {
    return { error: "Name, start and end dates are required" };
  }
  if (!Number.isFinite(discount) || discount <= 0) {
    return { error: "Enter a discount percentage" };
  }

  const productIds = formData
    .getAll("productIds")
    .map((value) => value.toString())
    .filter(Boolean);

  await prisma.flashSale.create({
    data: {
      name,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      discount: Math.round(discount),
      products: { connect: productIds.map((productId) => ({ id: productId })) },
    },
  });

  await audit({
    actor: admin,
    action: "flashsale.create",
    entity: "FlashSale",
    meta: { name, products: productIds.length },
  });
  revalidatePath("/admin/marketing");
  return { success: "Flash sale created" };
}

/* ------------------------------ coupons ------------------------------ */

const couponSchema = z.object({
  code: z.string().min(3).max(30),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().min(0),
  minSubtotal: z.coerce.number().min(0),
  description: z.string().optional(),
  expiresAt: z.string().optional(),
  usageLimit: z.coerce.number().min(0).optional(),
  customerId: z.string().optional(),
});

export async function saveCouponAction(
  _state: GrowthState,
  formData: FormData,
): Promise<GrowthState> {
  const admin = await assertPermission("marketing.manage");

  const parsed = couponSchema.safeParse({
    code: formData.get("code"),
    type: formData.get("type") ?? "PERCENT",
    value: formData.get("value"),
    minSubtotal: formData.get("minSubtotal") ?? 0,
    description: formData.get("description") || undefined,
    expiresAt: formData.get("expiresAt") || undefined,
    usageLimit: formData.get("usageLimit") || undefined,
    customerId: formData.get("customerId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the coupon" };
  }

  const code = parsed.data.code.trim().toUpperCase();
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) return { error: "That code already exists" };

  await prisma.coupon.create({
    data: {
      code,
      type: parsed.data.type,
      value:
        parsed.data.type === "FIXED"
          ? Math.round(parsed.data.value * 100)
          : Math.round(parsed.data.value),
      minSubtotal: Math.round(parsed.data.minSubtotal * 100),
      description: parsed.data.description ?? null,
      expiresAt: parsed.data.expiresAt
        ? new Date(parsed.data.expiresAt)
        : null,
      usageLimit: parsed.data.usageLimit || null,
      customerId: parsed.data.customerId || null,
      maxPerCustomer: parsed.data.customerId ? 1 : null,
    },
  });

  await audit({
    actor: admin,
    action: "coupon.create",
    entity: "Coupon",
    meta: { code },
  });
  revalidatePath("/admin/marketing");
  revalidatePath("/admin/coupons");
  return { success: `Coupon ${code} created` };
}

export async function toggleCouponAction(id: string) {
  const admin = await assertPermission("marketing.manage");
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) return { ok: false, message: "Coupon not found" };
  await prisma.coupon.update({
    where: { id },
    data: { active: !coupon.active },
  });
  await audit({
    actor: admin,
    action: "coupon.toggle",
    entity: "Coupon",
    entityId: id,
  });
  revalidatePath("/admin/marketing");
  revalidatePath("/admin/coupons");
  return { ok: true, message: "Coupon updated" };
}

/* -------------------------------- CMS -------------------------------- */

export async function savePageContentAction(
  _state: GrowthState,
  formData: FormData,
): Promise<GrowthState> {
  const admin = await assertPermission("cms.manage");

  const slug = formData.get("slug")?.toString().trim();
  const title = formData.get("title")?.toString().trim();
  const body = formData.get("body")?.toString() ?? "";
  const published = formData.get("published") === "on";

  if (!slug || !title) return { error: "Slug and title are required" };

  await prisma.pageContent.upsert({
    where: { slug },
    update: { title, body, published },
    create: { slug, title, body, published },
  });

  await audit({
    actor: admin,
    action: "cms.page.save",
    entity: "PageContent",
    meta: { slug },
  });
  revalidatePath("/admin/content");
  return { success: "Page saved" };
}

/* ----------------------------- settings ----------------------------- */

export async function saveSettingsAction(
  _state: GrowthState,
  formData: FormData,
): Promise<GrowthState> {
  const admin = await assertPermission("settings.manage");

  const entries: [string, string][] = [
    ["site_name", formData.get("siteName")?.toString() ?? ""],
    ["contact_email", formData.get("contactEmail")?.toString() ?? ""],
    ["contact_phone", formData.get("contactPhone")?.toString() ?? ""],
    ["contact_address", formData.get("contactAddress")?.toString() ?? ""],
    ["social_facebook", formData.get("socialFacebook")?.toString() ?? ""],
    ["social_instagram", formData.get("socialInstagram")?.toString() ?? ""],
    ["social_youtube", formData.get("socialYoutube")?.toString() ?? ""],
    ["seo_title", formData.get("seoTitle")?.toString() ?? ""],
    ["seo_description", formData.get("seoDescription")?.toString() ?? ""],
    ["shipping_flat_rate", formData.get("shippingFlatRate")?.toString() ?? "9.90"],
    [
      "shipping_free_threshold",
      formData.get("shippingFreeThreshold")?.toString() ?? "150",
    ],
    ["tax_rate", formData.get("taxRate")?.toString() ?? "8"],
    ["currency_default", formData.get("currencyDefault")?.toString() ?? "USD"],
    ["language_default", formData.get("languageDefault")?.toString() ?? "en"],
    ["usd_to_bdt_rate", formData.get("usdToBdtRate")?.toString() ?? "120"],
    ["support_email", formData.get("supportEmail")?.toString() ?? ""],
    ["invoice_prefix", formData.get("invoicePrefix")?.toString() ?? "INV"],
  ];

  for (const [key, value] of entries) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value, group: key.split("_")[0] },
    });
  }

  await audit({
    actor: admin,
    action: "settings.update",
    entity: "Setting",
    meta: { keys: entries.map(([key]) => key) },
  });

  revalidatePath("/admin/settings");
  return { success: "Settings saved" };
}

export async function getSettingsMap() {
  const rows = await prisma.setting.findMany();
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}
