"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { updateSegmentConfigAction } from "@/lib/actions/admin-segments";

export function SegmentConfigForm({
  config,
}: {
  config: {
    newDays: number;
    inactiveDays: number;
    regularOrders: number;
    highValueCents: number;
  };
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await updateSegmentConfigAction(data);
          setMessage(result.message);
        });
      }}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div>
        <label className="label" htmlFor="newDays">
          New customer window (days)
        </label>
        <input
          id="newDays"
          name="newDays"
          type="number"
          min={1}
          defaultValue={config.newDays}
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="inactiveDays">
          Inactivity window (days)
        </label>
        <input
          id="inactiveDays"
          name="inactiveDays"
          type="number"
          min={1}
          defaultValue={config.inactiveDays}
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="regularOrders">
          Regular customer orders
        </label>
        <input
          id="regularOrders"
          name="regularOrders"
          type="number"
          min={1}
          defaultValue={config.regularOrders}
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="highValueCents">
          High-value threshold (cents)
        </label>
        <input
          id="highValueCents"
          name="highValueCents"
          type="number"
          min={1}
          defaultValue={config.highValueCents}
          className="input"
        />
      </div>

      <div className="sm:col-span-2 lg:col-span-4">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Save rules
            </>
          )}
        </button>
        {message ? (
          <span className="ml-3 text-xs font-semibold text-success-fg">
            {message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
