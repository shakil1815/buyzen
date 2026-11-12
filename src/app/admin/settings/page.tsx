import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS, isAdminRole } from "@/lib/permissions";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/admin/ui";
import { SecuritySettings } from "@/components/admin/security-settings";

export const metadata = { title: "Settings & security" };

export default async function AdminSettingsPage() {
  await requirePermission("settings.manage");

  const [settings, auditLogs, admins, sessions, orderCount] = await Promise.all([
    prisma.setting.findMany({ orderBy: { group: "asc" } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.user.findMany({
      where: { role: { not: "CUSTOMER" } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastActiveAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.activityLog.findMany({
      where: { type: "admin.session" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.order.count(),
  ]);

  const customerCount = await prisma.user.count({
    where: { role: "CUSTOMER" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="System settings & security"
        description="Authentication, sessions, audit trail and data management."
      />

      <SecuritySettings
        settings={Object.fromEntries(settings.map((row) => [row.key, row.value]))}
        adminCount={admins.length}
        orderCount={orderCount}
        customerCount={customerCount}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Admin accounts"
          description="Every account with administrative access."
        >
          <DataTable head={["Admin", "Role", "Status", "Last active"]}>
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td className="px-3 py-2.5">
                  <p className="font-medium text-fg">{admin.name}</p>
                  <p className="text-[11px] text-fg-subtle">{admin.email}</p>
                </td>
                <td className="px-3 py-2.5 text-fg-muted">
                  {isAdminRole(admin.role) ? ROLE_LABELS[admin.role] : admin.role}
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge tone={admin.status === "ACTIVE" ? "green" : "red"}>
                    {admin.status}
                  </StatusBadge>
                </td>
                <td className="px-3 py-2.5 text-fg-muted">
                  {admin.lastActiveAt
                    ? formatDate(admin.lastActiveAt)
                    : "Never"}
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>

        <Panel
          title="Admin session log"
          description="Recent sign-in activity for administrative accounts."
        >
          {sessions.length === 0 ? (
            <EmptyState title="No recorded sessions" />
          ) : (
            <ul className="space-y-2">
              {sessions.map((session) => (
                <li
                  key={session.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm"
                >
                  <span className="text-fg">
                    {session.meta.replace(/[{}"]/g, "")}
                  </span>
                  <span className="text-[11px] text-fg-subtle">
                    {formatDate(session.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Security audit log"
        description="Every administrative action, with the actor and the target record."
      >
        {auditLogs.length === 0 ? (
          <EmptyState title="No audit entries yet" />
        ) : (
          <DataTable head={["When", "Actor", "Action", "Entity", "Details"]}>
            {auditLogs.map((entry) => (
              <tr key={entry.id}>
                <td className="px-3 py-2.5 text-fg-muted">
                  {formatDate(entry.createdAt)}
                </td>
                <td className="px-3 py-2.5 text-fg">
                  {entry.actorName ?? "system"}
                  {entry.actorRole ? (
                    <span className="block text-[10px] text-fg-subtle">
                      {entry.actorRole}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 font-mono text-[11px] text-fg">
                  {entry.action}
                </td>
                <td className="px-3 py-2.5 text-fg-muted">
                  {entry.entity ?? "—"}
                </td>
                <td className="px-3 py-2.5 text-[11px] text-fg-subtle">
                  {entry.meta.slice(0, 120)}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
