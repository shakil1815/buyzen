"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone } from "lucide-react";
import { createSegmentCampaignAction } from "@/lib/actions/admin-segments";

export function SegmentCampaignForm({ segment }: { segment: string }) {
  const [discount, setDiscount] = useState("10");
  const [minimum, setMinimum] = useState("50");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4">
      <p className="text-xs font-bold text-fg">Targeted campaign</p>
      <p className="mt-1 text-[11px] text-fg-muted">
        Issues a personal, single-use promo code to every customer in this
        segment. Codes are created as customer-specific coupons.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div>
          <label className="label" htmlFor={`discount-${segment}`}>
            Discount %
          </label>
          <input
            id={`discount-${segment}`}
            type="number"
            min={1}
            max={90}
            value={discount}
            onChange={(event) => setDiscount(event.target.value)}
            className="input w-24"
          />
        </div>
        <div>
          <label className="label" htmlFor={`minimum-${segment}`}>
            Min order ($)
          </label>
          <input
            id={`minimum-${segment}`}
            type="number"
            min={0}
            value={minimum}
            onChange={(event) => setMinimum(event.target.value)}
            className="input w-24"
          />
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (
              !window.confirm(
                `Issue a ${discount}% discount code to every customer in this segment?`,
              )
            ) {
              return;
            }
            startTransition(async () => {
              const result = await createSegmentCampaignAction(
                segment,
                Number(discount),
                Number(minimum) * 100,
              );
              setMessage(result.message);
              router.refresh();
            });
          }}
          className="btn btn-dark"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Megaphone className="h-4 w-4" />
          )}
          Issue codes
        </button>
      </div>

      {message ? (
        <p className="mt-2 text-xs font-semibold text-brand-fg">{message}</p>
      ) : null}
    </div>
  );
}
