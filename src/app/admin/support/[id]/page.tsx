import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/admin/ui";
import { TicketReplyForm } from "@/components/admin/ticket-reply-form";

export const metadata = { title: "Support ticket" };

export default async function SupportTicketPage(
  props: PageProps<"/admin/support/[id]">,
) {
  await requirePermission("support.manage");
  const { id } = await props.params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/support"
        className="inline-flex items-center gap-1 text-sm font-semibold text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Back to tickets
      </Link>

      <PageHeader
        title={ticket.subject}
        description={`${ticket.number} · opened ${formatDate(ticket.createdAt)}`}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Customer">
          <dl className="space-y-2 text-sm">
            {[
              ["Name", ticket.user?.name ?? "Guest"],
              ["Email", ticket.user?.email ?? "—"],
              ["Phone", ticket.user?.phone ?? "—"],
              ["Category", ticket.category],
              ["Priority", ticket.priority],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-fg-muted">{label}</dt>
                <dd className="text-right font-medium text-fg">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3">
            <StatusBadge tone={ticket.status === "RESOLVED" ? "green" : "blue"}>
              {ticket.status.replace("_", " ")}
            </StatusBadge>
          </div>
        </Panel>

        <div className="lg:col-span-2 space-y-4">
          <Panel title="Conversation">
            {ticket.messages.length === 0 ? (
              <EmptyState title="No messages yet" />
            ) : (
              <ol className="space-y-3">
                {ticket.messages.map((message) => (
                  <li
                    key={message.id}
                    className={`rounded-xl px-4 py-3 text-sm ${
                      message.authorType === "ADMIN"
                        ? "bg-brand-soft text-fg"
                        : "bg-surface-2 text-fg-muted"
                    }`}
                  >
                    <p className="text-xs font-semibold">
                      {message.authorName ?? message.authorType}{" "}
                      <span className="font-normal text-fg-subtle">
                        · {formatDate(message.createdAt)}
                      </span>
                    </p>
                    <p className="mt-1 whitespace-pre-line">{message.body}</p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel title="Reply">
            <TicketReplyForm ticketId={ticket.id} status={ticket.status} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
