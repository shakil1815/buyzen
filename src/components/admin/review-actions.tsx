"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Flag, Loader2, X } from "lucide-react";
import { moderateReviewAction } from "@/lib/actions/admin-support";

export function ReviewActions({ reviewId }: { reviewId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function decide(decision: "APPROVED" | "REJECTED" | "REPORTED") {
    startTransition(async () => {
      await moderateReviewAction(reviewId, decision);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
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
      <button
        type="button"
        disabled={pending}
        onClick={() => decide("REPORTED")}
        className="btn btn-outline px-2.5 py-1.5 text-[11px]"
      >
        <Flag className="h-3 w-3" /> Report
      </button>
    </div>
  );
}
