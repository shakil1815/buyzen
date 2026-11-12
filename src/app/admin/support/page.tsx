import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/admin/ui";

export const metadata = { title: "Support tickets" };

export default async function AdminSupportPage() {
  await requirePermission("support.manage");

  const tickets = await prisma.supportTicket.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 1 },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const open = tickets.filter((ticket) => ticket.status === "OPEN").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer support"
        description={`${open} ticket${open === 1 ? "" : "s"} waiting for a reply`}
      />

      <Panel>
        {tickets.length === 0 ? (
          <EmptyState
            title="No support tickets"
            description="Tickets raised from the storefront appear here."
          />
        ) : (
          <DataTable
            head={["Ticket", "Customer", "Category", "Priority", "Status", "Opened"]}
          >
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td className="px-3 py-3">
                  <Link
                    href={`/admin/support/${ticket.id}`}
                    className="font-medium text-fg hover:text-brand-fg"
                  >
                    {ticket.subject}
                  </Link>
                  <p className="text-[11px] text-fg-subtle">{ticket.number}</p>
                </td>
                <td className="px-3 py-3 text-fg-muted">
                  {ticket.user?.name ?? "Guest"}
                  {ticket.user ? (
                    <p className="text-[11px] text-fg-subtle">{ticket.user.email}</p>
                  ) : null}
                </td>
                <td className="px-3 py-3 text-fg-muted">{ticket.category}</td>
                <td className="px-3 py-3">
                  <StatusBadge
                    tone={
                      ticket.priority === "URGENT" || ticket.priority === "HIGH"
                        ? "red"
                        : ticket.priority === "LOW"
                          ? "grey"
                          : "amber"
                    }
                  >
                    {ticket.priority}
                  </StatusBadge>
                </td>
                <td className="px-3 py-3">
                  <StatusBadge
                    tone={
                      ticket.status === "RESOLVED"
                        ? "green"
                        : ticket.status === "OPEN"
                          ? "blue"
                          : "grey"
                    }
                  >
                    {ticket.status.replace("_", " ")}
                  </StatusBadge>
                </td>
                <td className="px-3 py-3 text-fg-muted">
                  {formatDate(ticket.createdAt)}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
