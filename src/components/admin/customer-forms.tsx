"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save, TriangleAlert } from "lucide-react";
import {
  updateCustomerAction,
  type CustomerActionState,
} from "@/lib/actions/admin-customers";
import { setCustomerStatusAction } from "@/lib/actions/admin-customers";

const DIVISIONS = [
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Sylhet",
  "Rangpur",
  "Mymensingh",
];

export function CustomerEditForm({
  customer,
}: {
  customer: {
    id: string;
    name: string;
    phone: string | null;
    city: string | null;
    district: string | null;
    division: string | null;
    postalCode: string | null;
    addressLine: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState<CustomerActionState, FormData>(
    updateCustomerAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={customer.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={customer.name}
            required
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={customer.phone ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="postalCode">
            Postal code
          </label>
          <input
            id="postalCode"
            name="postalCode"
            defaultValue={customer.postalCode ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="division">
            Division
          </label>
          <select
            id="division"
            name="division"
            defaultValue={customer.division ?? ""}
            className="input"
          >
            <option value="">—</option>
            {DIVISIONS.map((division) => (
              <option key={division} value={division}>
                {division}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="district">
            District
          </label>
          <input
            id="district"
            name="district"
            defaultValue={customer.district ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="city">
            City / town
          </label>
          <input
            id="city"
            name="city"
            defaultValue={customer.city ?? ""}
            className="input"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="addressLine">
            Street address
          </label>
          <input
            id="addressLine"
            name="addressLine"
            defaultValue={customer.addressLine ?? ""}
            className="input"
          />
        </div>
      </div>

      {state.error ? (
        <p className="rounded-xl border border-rose-200 bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger-fg">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-success-soft px-3.5 py-2.5 text-sm font-medium text-success-fg">
          <Check className="h-4 w-4" /> {state.success}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Saving…
          </>
        ) : (
          <>
            <Save className="h-4 w-4" /> Save changes
          </>
        )}
      </button>
    </form>
  );
}

export function CustomerStatusButton({
  customerId,
  status,
}: {
  customerId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const blocked = status === "BLOCKED";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const reason = blocked
          ? undefined
          : window.prompt(
              "Reason for blocking this account (optional):",
              "Manual review",
            ) ?? "";
        startTransition(async () => {
          await setCustomerStatusAction(
            customerId,
            blocked ? "ACTIVE" : "BLOCKED",
            reason,
          );
          router.refresh();
        });
      }}
      className={`btn ${blocked ? "btn-outline" : "btn-dark"}`}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <TriangleAlert className="h-4 w-4" />
      )}
      {blocked ? "Unblock account" : "Block account"}
    </button>
  );
}
