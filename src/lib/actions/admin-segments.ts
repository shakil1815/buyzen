"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import {
  SEGMENT_KEYS,
  SEGMENT_LABELS,
  computeSegments,
  getSegmentConfig,
  getSegmentCounts,
  getCustomerStatsMap,
} from "@/lib/admin/customers";

/** Creates a customer-specific coupon for every customer in a segment. */
export async function createSegmentCampaignAction(
  segment: string,
  discountPercent: number,
  minSubtotalCents: number,
) {
  const admin = await assertPermission("marketing.manage");

  if (!SEGMENT_KEYS.includes(segment as (typeof SEGMENT_KEYS)[number])) {
    return { ok: false, message: "Unknown segment" };
  }
  if (!Number.isFinite(discountPercent) || discountPercent <= 0) {
    return { ok: false, message: "Enter a valid discount percentage" };
  }

  const [config, stats, customers] = await Promise.all([
    getSegmentConfig(),
    getCustomerStatsMap(),
    prisma.user.findMany({
      where: { role: "CUSTOMER", status: "ACTIVE" },
      select: { id: true, name: true, email: true, createdAt: true, lastActiveAt: true },
    }),
  ]);

  const targets = customers.filter((customer) =>
    computeSegments(customer, stats.get(customer.id), config).includes(
      segment as (typeof SEGMENT_KEYS)[number],
    ),
  );

  if (targets.length === 0) {
    return { ok: false, message: "No customers match this segment" };
  }

  const stamp = Date.now().toString(36).toUpperCase();
  const code = `${segment.slice(0, 6).toUpperCase()}-${stamp}`;

  await prisma.$transaction(
    targets.map((customer) =>
      prisma.coupon.create({
        data: {
          code: `${code}-${customer.id.slice(-4).toUpperCase()}`,
          type: "PERCENT",
          value: Math.round(discountPercent),
          minSubtotal: Math.round(minSubtotalCents),
          description: `${SEGMENT_LABELS[segment as "new"]} · ${discountPercent}% off`,
          customerId: customer.id,
          maxPerCustomer: 1,
          active: true,
        },
      }),
    ),
  );

  await audit({
    actor: admin,
    action: "marketing.segment_campaign",
    entity: "Coupon",
    meta: { segment, customers: targets.length, discountPercent },
  });

  revalidatePath("/admin/segments");
  revalidatePath("/admin/marketing");
  return {
    ok: true,
    message: `${targets.length} customer coupon${targets.length === 1 ? "" : "s"} issued`,
  };
}

/** Updates the thresholds used by the segmentation rules. */
export async function updateSegmentConfigAction(formData: FormData) {
  const admin = await assertPermission("settings.manage");

  const entries: [string, string][] = [
    ["segment_new_days", String(formData.get("newDays") ?? 30)],
    ["segment_inactive_days", String(formData.get("inactiveDays") ?? 90)],
    ["segment_regular_orders", String(formData.get("regularOrders") ?? 3)],
    ["segment_high_value_cents", String(formData.get("highValueCents") ?? 50000)],
  ];

  for (const [key, value] of entries) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) continue;
    await prisma.setting.upsert({
      where: { key },
      update: { value: String(Math.round(numeric)), group: "segmentation" },
      create: { key, value: String(Math.round(numeric)), group: "segmentation" },
    });
  }

  await audit({
    actor: admin,
    action: "settings.segmentation.update",
    entity: "Setting",
  });

  revalidatePath("/admin/segments");
  revalidatePath("/admin/customers");
  return { ok: true, message: "Segmentation rules updated" };
}

export async function getSegmentSummary() {
  const [counts, config] = await Promise.all([
    getSegmentCounts(),
    getSegmentConfig(),
  ]);
  return { counts, config };
}
