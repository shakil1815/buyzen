"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export type SupportState = { error?: string; success?: string };

/* ------------------------------- tickets ------------------------------ */

export async function replyToTicketAction(
  _state: SupportState,
  formData: FormData,
): Promise<SupportState> {
  const admin = await assertPermission("support.manage");

  const ticketId = formData.get("ticketId")?.toString();
  const body = formData.get("body")?.toString().trim();
  const status = formData.get("status")?.toString();

  if (!ticketId || !body) return { error: "A reply is required" };

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, number: true, status: true },
  });
  if (!ticket) return { error: "Ticket not found" };

  await prisma.$transaction([
    prisma.ticketMessage.create({
      data: {
        ticketId,
        authorType: "ADMIN",
        authorName: admin.name,
        body,
      },
    }),
    ...(status
      ? [
          prisma.supportTicket.update({
            where: { id: ticketId },
            data: { status },
          }),
        ]
      : []),
  ]);

  await audit({
    actor: admin,
    action: "support.reply",
    entity: "SupportTicket",
    entityId: ticketId,
    meta: { number: ticket.number },
  });

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
  return { success: "Reply sent" };
}

export async function updateTicketStatusAction(
  ticketId: string,
  status: string,
) {
  const admin = await assertPermission("support.manage");
  await prisma.supportTicket.update({ where: { id: ticketId }, data: { status } });
  await audit({
    actor: admin,
    action: "support.status",
    entity: "SupportTicket",
    entityId: ticketId,
    meta: { status },
  });
  revalidatePath("/admin/support");
  return { ok: true, message: "Ticket updated" };
}

/* ------------------------------- reviews ----------------------------- */

export async function moderateReviewAction(
  reviewId: string,
  decision: "APPROVED" | "REJECTED" | "REPORTED",
  note?: string,
) {
  const admin = await assertPermission("reviews.moderate");

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { product: { select: { name: true } } },
  });
  if (!review) return { ok: false, message: "Review not found" };

  const data =
    decision === "REPORTED"
      ? { reported: true, status: "PENDING", adminNote: note ?? null }
      : { status: decision, reported: false, adminNote: note ?? null };

  await prisma.review.update({ where: { id: reviewId }, data });

  // Keep the cached product rating in sync with the visible reviews.
  const aggregate = await prisma.review.aggregate({
    where: { productId: review.productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.product.update({
    where: { id: review.productId },
    data: {
      rating: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
      reviewCount: aggregate._count.rating,
    },
  });

  if (decision === "REPORTED") {
    await notify({
      type: "review.reported",
      title: `Review reported for ${review.product.name}`,
      body: review.title,
      link: "/admin/reviews",
    });
  }

  await audit({
    actor: admin,
    action: `review.${decision.toLowerCase()}`,
    entity: "Review",
    entityId: reviewId,
  });

  revalidatePath("/admin/reviews");
  return { ok: true, message: `Review ${decision.toLowerCase()}` };
}

/* ---------------------------- notifications --------------------------- */

export async function markNotificationReadAction(notificationId: string) {
  await assertPermission("notifications.view");
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function markAllNotificationsReadAction() {
  await assertPermission("notifications.view");
  await prisma.notification.updateMany({
    where: { read: false },
    data: { read: true },
  });
  revalidatePath("/admin/notifications");
  return { ok: true };
}
