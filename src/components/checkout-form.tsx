"use client";

import { useActionState } from "react";
import { CreditCard, Lock } from "lucide-react";
import {
  placeOrderAction,
  startStripeCheckout,
  type CheckoutState,
} from "@/lib/actions/checkout";

export function CheckoutForm({
  defaultEmail,
  defaultName,
  total,
  stripeEnabled = false,
}: {
  defaultEmail: string;
  defaultName: string;
  total: number;
  stripeEnabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    placeOrderAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-6">
      <section className="card p-5">
        <h2 className="text-sm font-bold text-ink-900">Contact</h2>
        <div className="mt-4">
          <label className="label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={defaultEmail}
            placeholder="you@example.com"
            className="input"
          />
          <p className="mt-1.5 text-[11px] text-ink-400">
            We will send the receipt and tracking updates here.
          </p>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-bold text-ink-900">Shipping address</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="shippingName">
              Full name
            </label>
            <input
              id="shippingName"
              name="shippingName"
              required
              defaultValue={defaultName}
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="address1">
              Street address
            </label>
            <input id="address1" name="address1" required className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="address2">
              Apartment, suite (optional)
            </label>
            <input id="address2" name="address2" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="city">
              City
            </label>
            <input id="city" name="city" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="state">
              State / region
            </label>
            <input id="state" name="state" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="postalCode">
              Postal code
            </label>
            <input id="postalCode" name="postalCode" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="country">
              Country
            </label>
            <select id="country" name="country" required className="input" defaultValue="United States">
              <option>United States</option>
              <option>United Kingdom</option>
              <option>Canada</option>
              <option>Germany</option>
              <option>France</option>
              <option>Netherlands</option>
              <option>Australia</option>
              <option>Japan</option>
              <option>Singapore</option>
              <option>United Arab Emirates</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="phone">
              Phone (optional)
            </label>
            <input id="phone" name="phone" className="input" />
          </div>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink-900">Payment</h2>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
            <Lock className="h-3.5 w-3.5" /> Encrypted
          </span>
        </div>

        {stripeEnabled ? (
          <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50 p-4 text-sm text-ink-600">
            You will be redirected to Stripe Checkout to pay securely. Your card
            details never touch our servers.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="cardNumber">
                Card number
              </label>
              <div className="relative">
                <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  id="cardNumber"
                  name="cardNumber"
                  required
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4242 4242 4242 4242"
                  className="input pl-9"
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="expiry">
                Expiry (MM/YY)
              </label>
              <input
                id="expiry"
                name="expiry"
                required
                placeholder="12/29"
                autoComplete="cc-exp"
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="cvc">
                CVC
              </label>
              <input
                id="cvc"
                name="cvc"
                required
                inputMode="numeric"
                placeholder="123"
                autoComplete="cc-csc"
                className="input"
              />
            </div>
          </div>
        )}

        {!stripeEnabled ? (
          <p className="mt-4 rounded-xl bg-ink-50 p-3 text-[11px] leading-relaxed text-ink-500">
            Demo checkout — no real charge is made. Use test card{" "}
            <strong>4242 4242 4242 4242</strong> with any future expiry and any
            CVC.
          </p>
        ) : null}
      </section>

      {state.error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {state.error}
        </p>
      ) : null}

      {stripeEnabled ? (
        <button
          type="submit"
          formAction={startStripeCheckout}
          className="btn btn-primary w-full py-3.5 text-base"
        >
          Pay ${(total / 100).toFixed(2)} with Stripe
        </button>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary w-full py-3.5 text-base"
        >
          {pending ? "Processing payment…" : `Pay $${(total / 100).toFixed(2)}`}
        </button>
      )}

      <p className="text-center text-[11px] text-ink-400">
        By placing this order you agree to our terms of sale and privacy policy.
      </p>
    </form>
  );
}
