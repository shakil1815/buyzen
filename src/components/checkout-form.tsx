"use client";

import { useActionState } from "react";
import { CreditCard, Lock } from "lucide-react";
import {
  placeOrderAction,
  startStripeCheckout,
  type CheckoutState,
} from "@/lib/actions/checkout";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/orders";
import { useI18n } from "@/components/i18n-provider";
import { formatMoney } from "@/lib/format";

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
  const { t, currency, usdToBdt } = useI18n();
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    placeOrderAction,
    {},
  );

  const amount = formatMoney(total, currency, usdToBdt);

  return (
    <form action={formAction} className="space-y-6">
      <section className="card p-5">
        <h2 className="text-sm font-bold text-fg">{t("checkout.contact")}</h2>
        <div className="mt-4">
          <label className="label" htmlFor="email">
            {t("checkout.email")}
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
          <p className="mt-1.5 text-[11px] text-fg-subtle">
            {t("checkout.emailHelp")}
          </p>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-bold text-fg">
          {t("checkout.shippingAddress")}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="shippingName">
              {t("checkout.fullName")}
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
              {t("checkout.street")}
            </label>
            <input id="address1" name="address1" required className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="address2">
              {t("checkout.apartment")}
            </label>
            <input id="address2" name="address2" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="city">
              {t("checkout.city")}
            </label>
            <input id="city" name="city" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="state">
              {t("checkout.state")}
            </label>
            <input id="state" name="state" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="postalCode">
              {t("checkout.postalCode")}
            </label>
            <input id="postalCode" name="postalCode" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="country">
              {t("checkout.country")}
            </label>
            <select
              id="country"
              name="country"
              required
              className="input"
              defaultValue="Bangladesh"
            >
              <option>Bangladesh</option>
              <option>India</option>
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
              {t("checkout.phone")}
            </label>
            <input id="phone" name="phone" className="input" />
          </div>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-fg">{t("checkout.payment")}</h2>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-success-fg">
            <Lock className="h-3.5 w-3.5" /> {t("checkout.encrypted")}
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {PAYMENT_METHOD_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-2 rounded-xl border border-line px-3 py-2.5 transition has-[:checked]:border-brand-500 has-[:checked]:bg-brand-soft"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={option.value}
                defaultChecked={option.value === "cod"}
                className="mt-0.5 h-4 w-4 border-line-strong text-brand-fg"
              />
              <span>
                <span className="block text-sm font-semibold text-fg">
                  {option.label}
                </span>
                <span className="block text-[11px] text-fg-muted">
                  {option.hint}
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="paymentReference">
              Transaction ID
            </label>
            <input
              id="paymentReference"
              name="paymentReference"
              placeholder="e.g. 8HGF2K9L"
              className="input"
            />
            <p className="mt-1.5 text-[11px] text-fg-subtle">
              Required for bKash, Nagad and Rocket so our team can verify the
              payment before dispatch.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="senderNumber">
              Sender number
            </label>
            <input
              id="senderNumber"
              name="senderNumber"
              placeholder="01XXXXXXXXX"
              className="input"
            />
          </div>
        </div>

        {stripeEnabled ? (
          <div className="mt-4 rounded-xl border border-line bg-surface-2 p-4 text-sm text-fg-muted">
            {t("checkout.stripeNote")}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="cardNumber">
                {t("checkout.cardNumber")}
              </label>
              <div className="relative">
                <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
                <input
                  id="cardNumber"
                  name="cardNumber"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4242 4242 4242 4242"
                  className="input pl-9"
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="expiry">
                {t("checkout.expiry")}
              </label>
              <input
                id="expiry"
                name="expiry"
                placeholder="12/29"
                autoComplete="cc-exp"
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="cvc">
                {t("checkout.cvc")}
              </label>
              <input
                id="cvc"
                name="cvc"
                inputMode="numeric"
                placeholder="123"
                autoComplete="cc-csc"
                className="input"
              />
            </div>
          </div>
        )}

        {!stripeEnabled ? (
          <p className="mt-4 rounded-xl bg-surface-2 p-3 text-[11px] leading-relaxed text-fg-muted">
            {t("checkout.demoNote", { card: "4242 4242 4242 4242" })}
          </p>
        ) : null}
      </section>

      {state.error ? (
        <p className="rounded-xl border border-rose-200 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-fg">
          {state.error}
        </p>
      ) : null}

      {stripeEnabled ? (
        <button
          type="submit"
          formAction={startStripeCheckout}
          className="btn btn-primary w-full py-3.5 text-base"
        >
          {t("checkout.payStripe", { amount })}
        </button>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary w-full py-3.5 text-base"
        >
          {pending ? t("checkout.processing") : t("checkout.pay", { amount })}
        </button>
      )}

      <p className="text-center text-[11px] text-fg-subtle">
        {t("checkout.terms")}
      </p>
    </form>
  );
}
