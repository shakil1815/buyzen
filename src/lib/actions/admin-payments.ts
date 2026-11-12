"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export type PaymentActionState = { error?: string; success?: string };

/**
 * Approves a manual payment (bKash / Nagad / Rocket) after the admin checked
 * the reference with the provider.
 */
export async function verifyPaymentAction(paymentId: string) {
  const admin = await assertPermission("payments.verify");

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: { select: { id: true, number: true, total: true } } },
  });
  if (!payment) return { ok: false, message: "Payment not found" };
  if (payment.status === "VERIFIED") {
    return { ok: false, message: "Payment is already verified" };
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "VERIFIED",
        verifiedBy: admin.name,
        verifiedAt: new Date(),
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: "PAID" },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: payment.orderId,
        type: "payment",
        message: `Payment verified via ${payment.method.toUpperCase()}${
          payment.reference ? ` · ref ${payment.reference}` : ""
        }`,
        actor: admin.name,
      },
    }),
  ]);

  await notify({
    type: "payment.verified",
    title: `Payment verified for ${payment.order.number}`,
    body: `${payment.method.toUpperCase()} · ${payment.reference ?? "no reference"}`,
    link: `/admin/orders/${payment.orderId}`,
  });

  await audit({
    actor: admin,
    action: "payment.verify",
    entity: "Payment",
    entityId: paymentId,
    meta: { order: payment.order.number, amount: payment.amount },
  });

  revalidatePath("/admin/payments");
  revalidatePath(`/admin/orders/${payment.orderId}`);
  return { ok: true, message: "Payment verified" };
}

export async function rejectPaymentAction(paymentId: string, reason?: string) {
  const admin = await assertPermission("payments.verify");

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: { select: { id: true, number: true } } },
  });
  if (!payment) return { ok: false, message: "Payment not found" };

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "REJECTED",
        notes: reason ?? null,
        verifiedBy: admin.name,
        verifiedAt: new Date(),
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: "FAILED" },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: payment.orderId,
        type: "payment",
        message: `Payment rejected${reason ? ` — ${reason}` : ""}`,
        actor: admin.name,
      },
    }),
  ]);

  await notify({
    type: "payment.failed",
    title: `Payment rejected for ${payment.order.number}`,
    body: reason ?? "Rejected by admin",
    link: `/admin/orders/${payment.orderId}`,
  });

  await audit({
    actor: admin,
    action: "payment.reject",
    entity: "Payment",
    entityId: paymentId,
    meta: { order: payment.order.number, reason: reason ?? null },
  });

  revalidatePath("/admin/payments");
  revalidatePath(`/admin/orders/${payment.orderId}`);
  return { ok: true, message: "Payment rejected" };
}

export async function resolveRefundAction(
  refundId: string,
  decision: "APPROVED" | "REJECTED",
  note?: string,
) {
  const admin = await assertPermission("payments.refund");

  const refund = await prisma.refundRequest.findUnique({
    where: { id: refundId },
    include: { order: { select: { id: true, number: true, total: true } } },
  });
  if (!refund) return { ok: false, message: "Refund request not found" };
  if (refund.status !== "PENDING") {
    return { ok: false, message: "This request was already resolved" };
  }

  await prisma.$transaction([
    prisma.refundRequest.update({
      where: { id: refundId },
      data: {
        status: decision,
        resolution: note ?? null,
        resolvedBy: admin.name,
        resolvedAt: new Date(),
      },
    }),
    ...(decision === "APPROVED"
      ? [
          prisma.order.update({
            where: { id: refund.orderId },
            data: {
              status: "RETURNED",
              refundedAmount: refund.amount,
              paymentStatus: "REFUNDED",
            },
          }),
          prisma.payment.create({
            data: {
              orderId: refund.orderId,
              method: "refund",
              amount: refund.amount,
              reference: `RF-${Date.now().toString(36).toUpperCase()}`,
              status: "REFUNDED",
              verifiedBy: admin.name,
              verifiedAt: new Date(),
              notes: note ?? null,
            },
          }),
          prisma.orderEvent.create({
            data: {
              orderId: refund.orderId,
              type: "refund",
              message: `Refund approved · ${refund.reason}`,
              actor: admin.name,
            },
          }),
        ]
      : [
          prisma.orderEvent.create({
            data: {
              orderId: refund.orderId,
              type: "refund",
              message: `Refund rejected${note ? ` — ${note}` : ""}`,
              actor: admin.name,
            },
          }),
        ]),
  ]);

  await notify({
    type: "refund.requested",
    title: `Refund ${decision.toLowerCase()} for ${refund.order.number}`,
    body: note ?? "",
    link: `/admin/orders/${refund.orderId}`,
  });

  await audit({
    actor: admin,
    action: `refund.${decision.toLowerCase()}`,
    entity: "RefundRequest",
    entityId: refundId,
    meta: { order: refund.order.number, amount: refund.amount },
  });

  revalidatePath("/admin/refunds");
  revalidatePath(`/admin/orders/${refund.orderId}`);
  return {
    ok: true,
    message: decision === "APPROVED" ? "Refund approved" : "Refund rejected",
  };
}

/** Marks a cash-on-delivery order as collected. */
export async function collectCodAction(orderId: string) {
  const admin = await assertPermission("payments.verify");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, number: true, paymentMethod: true, paymentStatus: true },
  });
  if (!order) return { ok: false, message: "Order not found" };
  if (order.paymentMethod !== "cod") {
    return { ok: false, message: "This order is not cash on delivery" };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID" },
    }),
    prisma.orderEvent.create({
      data: {
        orderId,
        type: "payment",
        message: "Cash on delivery collected",
        actor: admin.name,
      },
    }),
  ]);

  await audit({
    actor: admin,
    action: "payment.cod_collected",
    entity: "Order",
    entityId: orderId,
    meta: { order: order.number },
  });

  revalidatePath("/admin/payments");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: "COD payment recorded" };
}
