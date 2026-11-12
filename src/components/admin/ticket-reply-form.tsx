"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import { replyToTicketAction, type SupportState } from "@/lib/actions/admin-support";

const STATUSES = ["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"];

export function TicketReplyForm({
  ticketId,
  status,
}: {
  ticketId: string;
  status: string;
}) {
  const [state, formAction, pending] = useActionState<SupportState, FormData>(
    replyToTicketAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="ticketId" value={ticketId} />
      <textarea
        name="body"
        rows={4}
        required
        placeholder="Write your reply to the customer…"
        className="input resize-y"
        aria-label="Reply"
      />
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="status"
          defaultValue={status}
          className="input w-auto"
          aria-label="Ticket status"
        >
          {STATUSES.map((option) => (
            <option key={option} value={option}>
              {option.replace("_", " ")}
            </option>
          ))}
        </select>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send reply
        </button>
        {state.error ? (
          <span className="text-xs font-semibold text-danger-fg">
            {state.error}
          </span>
        ) : null}
        {state.success ? (
          <span className="text-xs font-semibold text-success-fg">
            {state.success}
          </span>
        ) : null}
      </div>
    </form>
  );
}
