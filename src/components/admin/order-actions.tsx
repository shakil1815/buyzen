"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  Save,
  Truck,
  Undo2,
} from "lucide-react";
import {
  addOrderNoteAction,
  assignCourierAction,
  requestReturnAction,
  updateOrderStatusAction,
  type OrderActionState,
} from "@/lib/actions/admin-orders";
import { allowedTransitions, ORDER_STATUS_LABELS } from "@/lib/orders";

export function OrderStatusManager({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const options = allowedTransitions(status);

  if (options.length === 0) {
    return (
      <p className="text-xs text-fg-muted">
        This order is in a final state and can no longer be changed.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          disabled={pending}
          onClick={() => {
            let reason: string | undefined;
            if (option === "CANCELLED") {
              const input = window.prompt(
                "Cancellation reason (required):",
                "Customer request",
              );
              if (!input) return;
              reason = input;
            }
            startTransition(async () => {
              await updateOrderStatusAction(orderId, option, reason);
              router.refresh();
            });
          }}
          className={`btn ${option === "CANCELLED" ? "btn-outline" : "btn-primary"}`}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : option === "CANCELLED" ? (
            <Undo2 className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {option === "CANCELLED"
            ? "Cancel order"
            : `Move to ${ORDER_STATUS_LABELS[option]}`}
        </button>
      ))}

      {["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(status) ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const reason = window.prompt("Return / refund reason:", "Damaged on arrival");
            if (reason === null) return;
            startTransition(async () => {
              await requestReturnAction(orderId, reason);
              router.refresh();
            });
          }}
          className="btn btn-outline"
        >
          <Undo2 className="h-4 w-4" /> Request return
        </button>
      ) : null}
    </div>
  );
}

export function CourierForm({
  orderId,
  courierName,
  courierPhone,
  trackingNumber,
}: {
  orderId: string;
  courierName: string | null;
  courierPhone: string | null;
  trackingNumber: string | null;
}) {
  const [state, formAction, pending] = useActionState<OrderActionState, FormData>(
    assignCourierAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="courierName">
            Courier name
          </label>
          <input
            id="courierName"
            name="courierName"
            defaultValue={courierName ?? ""}
            required
            className="input"
            placeholder="Steadfast / Pathao / Sundarban"
          />
        </div>
        <div>
          <label className="label" htmlFor="courierPhone">
            Courier phone
          </label>
          <input
            id="courierPhone"
            name="courierPhone"
            defaultValue={courierPhone ?? ""}
            className="input"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="trackingNumber">
            Tracking number
          </label>
          <input
            id="trackingNumber"
            name="trackingNumber"
            defaultValue={trackingNumber ?? ""}
            required
            className="input"
            placeholder="TRK-123456789"
          />
        </div>
      </div>

      {state.error ? (
        <p className="text-xs font-semibold text-danger-fg">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-xs font-semibold text-success-fg">{state.success}</p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-dark">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Truck className="h-4 w-4" />
        )}
        Save courier details
      </button>
    </form>
  );
}

export function OrderNoteForm({ orderId }: { orderId: string }) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-3">
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={3}
        placeholder="Internal note for the team (visible to admins only)…"
        className="input resize-y"
        aria-label="Internal note"
      />
      <button
        type="button"
        disabled={pending || !note.trim()}
        onClick={() => {
          startTransition(async () => {
            await addOrderNoteAction(orderId, note);
            setNote("");
            router.refresh();
          });
        }}
        className="btn btn-dark"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Add note
      </button>
    </div>
  );
}
