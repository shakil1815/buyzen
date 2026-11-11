"use client";

import { useActionState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { createCouponAction, type AdminState } from "@/lib/actions/admin";

export function CouponForm() {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(
    createCouponAction,
    {},
  );

  return (
    <form action={formAction} className="card space-y-4 p-5">
      <h2 className="text-sm font-bold text-ink-900">Create a promo code</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="code">
            Code
          </label>
          <input
            id="code"
            name="code"
            required
            placeholder="SUMMER25"
            className="input uppercase"
          />
        </div>
        <div>
          <label className="label" htmlFor="type">
            Type
          </label>
          <select id="type" name="type" className="input" defaultValue="PERCENT">
            <option value="PERCENT">Percentage off</option>
            <option value="FIXED">Fixed amount off</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="value">
            Value
          </label>
          <input
            id="value"
            name="value"
            type="number"
            min="1"
            required
            placeholder="10 or 25.00"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="minSubtotal">
            Minimum order ($)
          </label>
          <input
            id="minSubtotal"
            name="minSubtotal"
            type="number"
            min="0"
            defaultValue="0"
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="description">
          Description
        </label>
        <input
          id="description"
          name="description"
          placeholder="10% off orders over $50"
          className="input"
        />
      </div>

      {state.error ? (
        <p className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4 shrink-0" /> {state.success}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Creating…" : "Create coupon"}
      </button>
    </form>
  );
}
