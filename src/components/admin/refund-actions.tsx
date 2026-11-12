"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { resolveRefundAction } from "@/lib/actions/admin-payments";

export function RefundActions({ refundId }: { refundId: string }) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const router = useRouter();

  function decide(decision: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      await resolveRefundAction(refundId, decision, note);
      setNote("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Note"
        className="input w-28 px-2 py-1 text-[11px]"
        aria-label="Refund decision note"
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => decide("APPROVED")}
        className="btn btn-primary px-2.5 py-1.5 text-[11px]"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Check className="h-3 w-3" />
        )}
        Approve
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => decide("REJECTED")}
        className="btn btn-outline px-2.5 py-1.5 text-[11px]"
      >
        <X className="h-3 w-3" /> Reject
      </button>
    </div>
  );
}
