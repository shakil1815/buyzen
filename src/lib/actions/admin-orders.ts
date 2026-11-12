"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { canTransition, isOrderStatus } from "@/lib/orders";

export type OrderActionState = { error?: string; success?: string };

const STATUS_TIMESTAMPS: Record<string, "confirmedAt" | "packedAt" | "shippedAt" | "deliveredAt"> = {
  CONFIRMED: "confirmedAt",
  PACKED: "packedAt",
  SHIPPED: "shippedAt",
  DELIVERED: "deliveredAt",
};

async function recordEvent(
  orderId: string,
  type: string,
  message: string,
  actor: string,
  meta: Record<string, unknown> = {},
) {
  await prisma.orderEvent.create({
    data: {
      orderId,
      type,
      message,
      actor,
      meta: JSON.stringify(meta),
    },
  });
}

export async function updateOrderStatusAction(
  orderId: string,
  nextStatus: string,
  reason?: string,
) {
  const admin = await assertPermission("orders.manage");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, number: true, status: true },
  });
  if (!order) return { ok: false, message: "Order not found" };

  if (!isOrderStatus(nextStatus)) {
    return { ok: false, message: "Unknown status" };
  }

  if (order.status === nextStatus) {
    return { ok: false, message: "Order is already in that status" };
  }

  if (!canTransition(order.status, nextStatus)) {
    return {
      ok: false,
      message: `Cannot move an order from ${order.status} to ${nextStatus}`,
    };
  }

  if (nextStatus === "CANCELLED" && !reason?.trim()) {
    return { ok: false, message: "A cancellation reason is required" };
  }

  const timestampField = STATUS_TIMESTAMPS[nextStatus];

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: nextStatus,
        cancelReason: nextStatus === "CANCELLED" ? (reason ?? null) : null,
        ...(timestampField ? { [timestampField]: new Date() } : {}),
      },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        from: order.status,
        to: nextStatus,
        actor: admin.name,
        reason: reason ?? null,
      },
    }),
    prisma.orderEvent.create({
      data: {
        orderId,
        type: "status",
        message: `Status changed from ${order.status} to ${nextStatus}${reason ? ` — ${reason}` : ""}`,
        actor: admin.name,
        meta: JSON.stringify({ from: order.status, to: nextStatus }),
      },
    }),
  ]);

  await audit({
    actor: admin,
    action: "order.status",
    entity: "Order",
    entityId: orderId,
    meta: { from: order.status, to: nextStatus, reason: reason ?? null },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true, message: `Order moved to ${nextStatus}` };
}

const courierSchema = z.object({
  orderId: z.string().min(1),
  courierName: z.string().min(2).max(80),
  courierPhone: z.string().max(40).optional(),
  trackingNumber: z.string().min(3).max(80),
});

export async function assignCourierAction(
  _state: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const admin = await assertPermission("orders.manage");

  const parsed = courierSchema.safeParse({
    orderId: formData.get("orderId"),
    courierName: formData.get("courierName"),
    courierPhone: formData.get("courierPhone") ?? "",
    trackingNumber: formData.get("trackingNumber"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid courier details" };
  }

  const data = parsed.data;
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    select: { id: true, number: true },
  });
  if (!order) return { error: "Order not found" };

  await prisma.$transaction([
    prisma.order.update({
      where: { id: data.orderId },
      data: {
        courierName: data.courierName,
        courierPhone: data.courierPhone || null,
        trackingNumber: data.trackingNumber,
      },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: data.orderId,
        type: "courier",
        message: `Courier ${data.courierName} assigned · tracking ${data.trackingNumber}`,
        actor: admin.name,
        meta: JSON.stringify(data),
      },
    }),
  ]);

  await audit({
    actor: admin,
    action: "order.courier",
    entity: "Order",
    entityId: data.orderId,
    meta: data,
  });

  revalidatePath(`/admin/orders/${data.orderId}`);
  return { success: "Courier information saved" };
}

export async function addOrderNoteAction(
  orderId: string,
  note: string,
  type = "note",
) {
  const admin = await assertPermission("orders.manage");
  const body = note.trim();
  if (!body) return { ok: false, message: "Note is empty" };

  await recordEvent(orderId, type, body, admin.name);
  await audit({
    actor: admin,
    action: "order.note",
    entity: "Order",
    entityId: orderId,
  });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: "Note added" };
}

export async function cancelOrderAction(orderId: string, reason: string) {
  await assertPermission("orders.cancel");
  return updateOrderStatusAction(orderId, "CANCELLED", reason);
}

export async function requestReturnAction(orderId: string, reason: string) {
  const admin = await assertPermission("orders.manage");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, number: true, total: true, status: true },
  });
  if (!order) return { ok: false, message: "Order not found" };

  const existing = await prisma.refundRequest.findFirst({
    where: { orderId, status: "PENDING" },
  });
  if (existing) {
    return { ok: false, message: "A refund request is already open" };
  }

  await prisma.refundRequest.create({
    data: {
      orderId,
      amount: order.total,
      reason: reason.trim() || "Customer request",
      status: "PENDING",
    },
  });

  await recordEvent(
    orderId,
    "return",
    `Return/refund requested — ${reason || "no reason given"}`,
    admin.name,
  );

  await notify({
    type: "return.requested",
    title: `Return requested for ${order.number}`,
    body: reason || "No reason supplied",
    link: `/admin/orders/${orderId}`,
  });

  await audit({
    actor: admin,
    action: "order.return.requested",
    entity: "Order",
    entityId: orderId,
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/refunds");
  return { ok: true, message: "Refund request created" };
}
