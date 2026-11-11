"use client";

import { useActionState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { createCouponAction, type AdminState } from "@/lib/actions/admin";
import { useI18n } from "@/components/i18n-provider";

export function CouponForm() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState<AdminState, FormData>(
    createCouponAction,
    {},
  );

  return (
    <form action={formAction} className="card space-y-4 p-5">
      <h2 className="text-sm font-bold text-fg">{t("admin.coupons.createTitle")}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="code">
            {t("admin.coupons.code")}
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
            {t("admin.coupons.type")}
          </label>
          <select id="type" name="type" className="input" defaultValue="PERCENT">
            <option value="PERCENT">{t("admin.coupons.percent")}</option>
            <option value="FIXED">{t("admin.coupons.fixed")}</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="value">
            {t("admin.coupons.value")}
          </label>
          <input
            id="value"
            name="value"
            type="number"
            min="1"
            required
            placeholder={t("admin.coupons.valuePlaceholder")}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="minSubtotal">
            {t("admin.coupons.minOrder")}
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
          {t("admin.coupons.description")}
        </label>
        <input
          id="description"
          name="description"
          placeholder={t("admin.coupons.descriptionPlaceholder")}
          className="input"
        />
      </div>

      {state.error ? (
        <p className="flex items-center gap-2 rounded-xl border border-rose-200 bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger-fg">
          <AlertCircle className="h-4 w-4 shrink-0" /> {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-success-soft px-3.5 py-2.5 text-sm font-medium text-success-fg">
          <Check className="h-4 w-4 shrink-0" /> {state.success}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? t("admin.coupons.creating") : t("admin.coupons.create")}
      </button>
    </form>
  );
}
