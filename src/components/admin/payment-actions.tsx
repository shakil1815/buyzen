"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import {
  collectCodAction,
  rejectPaymentAction,
  verifyPaymentAction,
} from "@/lib/actions/admin-payments";

export function PaymentVerifyButton({
  paymentId,
  status,
}: {
  paymentId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  if (status === "VERIFIED") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success-fg">
        <Check className="h-3.5 w-3.5" /> Verified
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await verifyPaymentAction(paymentId);
            router.refresh();
          });
        }}
        className="btn btn-primary px-2.5 py-1.5 text-[11px]"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Check className="h-3 w-3" />
        )}
        Verify
      </button>

      {showReject ? (
        <span className="flex items-center gap-1">
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason"
            className="input w-28 px-2 py-1 text-[11px]"
            aria-label="Rejection reason"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await rejectPaymentAction(paymentId, reason);
                setShowReject(false);
                setReason("");
                router.refresh();
              });
            }}
            className="btn btn-outline px-2.5 py-1.5 text-[11px]"
          >
            Confirm
          </button>
        </span>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => setShowReject(true)}
          className="btn btn-outline px-2.5 py-1.5 text-[11px]"
        >
          <X className="h-3 w-3" /> Reject
        </button>
      )}
    </div>
  );
}

export function CollectCodButton({
  orderId,
  paymentStatus,
}: {
  orderId: string;
  paymentStatus: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (paymentStatus === "PAID") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success-fg">
        <Check className="h-3.5 w-3.5" /> Collected
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await collectCodAction(orderId);
          router.refresh();
        });
      }}
      className="btn btn-dark px-2.5 py-1.5 text-[11px]"
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
      Mark collected
    </button>
  );
}
