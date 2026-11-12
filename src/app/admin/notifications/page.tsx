import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { notificationIcon } from "@/lib/notifications";
import { formatDate } from "@/lib/format";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/admin/ui";
import { NotificationActions } from "@/components/admin/notification-actions";

export const metadata = { title: "Notifications" };

export default async function AdminNotificationsPage() {
  await requirePermission("notifications.view");

  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.notification.count({ where: { read: false } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification centre"
        description={`${unread} unread notification${unread === 1 ? "" : "s"}`}
        actions={<NotificationActions />}
      />

      <Panel>
        {notifications.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            description="New orders, payments, refunds, tickets and low stock alerts arrive here."
          />
        ) : (
          <ul className="divide-y divide-line">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-3 text-base">
                  {notificationIcon(notification.type)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-fg">
                      {notification.title}
                    </p>
                    {!notification.read ? (
                      <StatusBadge tone="blue">New</StatusBadge>
                    ) : null}
                  </div>
                  {notification.body ? (
                    <p className="mt-0.5 text-xs text-fg-muted">
                      {notification.body}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-fg-subtle">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {notification.link ? (
                    <a
                      href={notification.link}
                      className="btn btn-outline px-2.5 py-1.5 text-[11px]"
                    >
                      Open
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
