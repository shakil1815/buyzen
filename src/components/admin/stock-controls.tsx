"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import {
  adjustStockAction,
  setLowStockThresholdAction,
} from "@/lib/actions/admin-catalogue";

export function StockAdjustForm({
  productId,
  threshold,
}: {
  productId: string;
  threshold: number;
}) {
  const [delta, setDelta] = useState("0");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        value={delta}
        onChange={(event) => setDelta(event.target.value)}
        type="number"
        placeholder="±0"
        className="input w-16 px-2 py-1 text-xs"
        aria-label="Stock adjustment"
      />
      <input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Reason"
        className="input w-24 px-2 py-1 text-xs"
        aria-label="Adjustment reason"
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await adjustStockAction(productId, Number(delta || 0), reason);
            router.refresh();
          });
        }}
        className="btn btn-dark px-2.5 py-1.5 text-[11px]"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Save className="h-3 w-3" />
        )}
        Apply
      </button>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(async () => {
            await setLowStockThresholdAction(
              productId,
              Number(data.get("threshold") ?? threshold),
            );
            router.refresh();
          });
        }}
        className="flex items-center gap-1"
      >
        <input
          name="threshold"
          type="number"
          min={0}
          defaultValue={threshold}
          className="input w-16 px-2 py-1 text-xs"
          aria-label="Low stock threshold"
        />
        <button
          type="submit"
          disabled={pending}
          className="btn btn-outline px-2.5 py-1.5 text-[11px]"
        >
          Set alert
        </button>
      </form>
    </div>
  );
}
