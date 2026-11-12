import { prisma } from "@/lib/prisma";

export const NOTIFICATION_TYPES = [
  "order.created",
  "customer.registered",
  "payment.pending",
  "payment.verified",
  "payment.failed",
  "return.requested",
  "refund.requested",
  "stock.low",
  "ticket.created",
  "security.event",
  "review.reported",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

const TYPE_ICONS: Record<string, string> = {
  "order.created": "🛍️",
  "customer.registered": "👤",
  "payment.pending": "💳",
  "payment.verified": "✅",
  "payment.failed": "⚠️",
  "return.requested": "↩️",
  "refund.requested": "💸",
  "stock.low": "📦",
  "ticket.created": "🎫",
  "security.event": "🔐",
  "review.reported": "⭐",
};

/** Creates an entry in the admin notification centre. */
export async function notify(options: {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        type: options.type,
        title: options.title,
        body: options.body ?? null,
        link: options.link ?? null,
      },
    });
  } catch (error) {
    console.error("notification failed", error);
  }
}

export function notificationIcon(type: string) {
  return TYPE_ICONS[type] ?? "🔔";
}
