"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import { audit } from "@/lib/audit";

export async function deleteProductAction(id: string) {
  const admin = await assertPermission("products.delete");

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, sku: true },
  });
  if (!product) return;

  await prisma.product.delete({ where: { id } });

  await audit({
    actor: admin,
    action: "product.delete",
    entity: "Product",
    entityId: id,
    meta: { name: product.name, sku: product.sku },
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");

}

export async function toggleCouponAction(id: string) {
  const admin = await assertPermission("marketing.manage");

  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) return;

  await prisma.coupon.update({
    where: { id },
    data: { active: !coupon.active },
  });

  await audit({
    actor: admin,
    action: "coupon.toggle",
    entity: "Coupon",
    entityId: id,
    meta: { code: coupon.code, active: !coupon.active },
  });

  revalidatePath("/admin/coupons");
  revalidatePath("/admin/marketing");

}

export async function updateOrderStatusAction(id: string, status: string) {
  const admin = await assertPermission("orders.manage");

  await prisma.order.update({ where: { id }, data: { status } });

  await audit({
    actor: admin,
    action: "order.status",
    entity: "Order",
    entityId: id,
    meta: { status },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);

}
