"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import {
  saveBannerAction,
  saveCouponAction,
  saveFlashSaleAction,
  toggleCouponAction,
  type GrowthState,
} from "@/lib/actions/admin-growth";

export function BannerForm() {
  const [state, formAction, pending] = useActionState<GrowthState, FormData>(
    saveBannerAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="banner-title">
            Title
          </label>
          <input id="banner-title" name="title" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="banner-subtitle">
            Subtitle
          </label>
          <input id="banner-subtitle" name="subtitle" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="banner-image">
            Image path
          </label>
          <input
            id="banner-image"
            name="image"
            placeholder="/products/photos/banner.jpg"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="banner-link">
            Link
          </label>
          <input
            id="banner-link"
            name="link"
            placeholder="/products?deals=1"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="banner-position">
            Position
          </label>
          <select id="banner-position" name="position" className="input">
            <option value="home">Home</option>
            <option value="sidebar">Sidebar</option>
            <option value="footer">Footer</option>
          </select>
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm text-fg-muted">
          <input
            type="checkbox"
            name="active"
            defaultChecked
            className="h-4 w-4 rounded border-line-strong text-brand-fg"
          />
          Live
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-dark">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save banner
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

export function FlashSaleForm() {
  const [state, formAction, pending] = useActionState<GrowthState, FormData>(
    saveFlashSaleAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="flash-name">
            Name
          </label>
          <input id="flash-name" name="name" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="flash-discount">
            Discount %
          </label>
          <input
            id="flash-discount"
            name="discount"
            type="number"
            min={1}
            max={90}
            required
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="flash-start">
            Starts
          </label>
          <input
            id="flash-start"
            name="startsAt"
            type="datetime-local"
            required
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="flash-end">
            Ends
          </label>
          <input
            id="flash-end"
            name="endsAt"
            type="datetime-local"
            required
            className="input"
          />
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn btn-dark">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Schedule flash sale
      </button>
      {state.error ? (
        <span className="ml-3 text-xs font-semibold text-danger-fg">
          {state.error}
        </span>
      ) : null}
      {state.success ? (
        <span className="ml-3 text-xs font-semibold text-success-fg">
          {state.success}
        </span>
      ) : null}
    </form>
  );
}

export function CouponForm({
  customers,
}: {
  customers: { id: string; name: string; email: string }[];
}) {
  const [state, formAction, pending] = useActionState<GrowthState, FormData>(
    saveCouponAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="coupon-code">
            Code
          </label>
          <input
            id="coupon-code"
            name="code"
            required
            placeholder="EID25"
            className="input uppercase"
          />
        </div>
        <div>
          <label className="label" htmlFor="coupon-type">
            Type
          </label>
          <select id="coupon-type" name="type" className="input">
            <option value="PERCENT">Percentage off</option>
            <option value="FIXED">Fixed amount off</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="coupon-value">
            Value
          </label>
          <input
            id="coupon-value"
            name="value"
            type="number"
            min={1}
            required
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="coupon-min">
            Minimum order ($)
          </label>
          <input
            id="coupon-min"
            name="minSubtotal"
            type="number"
            min={0}
            defaultValue={0}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="coupon-expires">
            Expires
          </label>
          <input
            id="coupon-expires"
            name="expiresAt"
            type="date"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="coupon-usage">
            Usage limit
          </label>
          <input
            id="coupon-usage"
            name="usageLimit"
            type="number"
            min={0}
            className="input"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="coupon-description">
            Description
          </label>
          <input
            id="coupon-description"
            name="description"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="coupon-customer">
            Customer (optional)
          </label>
          <select id="coupon-customer" name="customerId" className="input">
            <option value="">Everyone</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} · {customer.email}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn btn-dark">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Create coupon
      </button>
      {state.error ? (
        <span className="ml-3 text-xs font-semibold text-danger-fg">
          {state.error}
        </span>
      ) : null}
      {state.success ? (
        <span className="ml-3 text-xs font-semibold text-success-fg">
          {state.success}
        </span>
      ) : null}
    </form>
  );
}

export function ToggleButton({
  action,
  id,
  label,
}: {
  action: (id: string) => Promise<unknown>;
  id: string;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await action(id);
          router.refresh();
        });
      }}
      className="btn btn-outline px-2.5 py-1.5 text-[11px]"
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
      {label}
    </button>
  );
}

export function ToggleCouponButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [showForm] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await toggleCouponAction(id);
          router.refresh();
        });
      }}
      className="btn btn-outline px-2.5 py-1.5 text-[11px]"
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
      {showForm ? "" : "Toggle"}
    </button>
  );
}
