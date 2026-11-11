"use client";

import { useState, useTransition } from "react";
import { Tag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { applyCouponAction, removeCouponAction } from "@/lib/actions/cart";
import { useI18n } from "@/components/i18n-provider";

export function CouponForm({
  applied,
  error,
}: {
  applied: string | null;
  error: string | null;
}) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function apply() {
    startTransition(async () => {
      const result = await applyCouponAction(code);
      setMessage(result.message);
      if (result.ok) setCode("");
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await removeCouponAction();
      setMessage(null);
      router.refresh();
    });
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-success-soft px-3.5 py-2.5 text-sm">
        <span className="flex items-center gap-2 font-semibold text-success-fg">
          <Tag className="h-4 w-4" /> {t("cart.applied", { code: applied })}
        </span>
        <button
          type="button"
          onClick={remove}
          className="inline-flex items-center gap-1 text-xs font-semibold text-success-fg hover:text-fg"
        >
          <X className="h-3.5 w-3.5" /> {t("cart.removeCode")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="coupon-code">
          {t("cart.promoCode")}
        </label>
        <input
          id="coupon-code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder={t("cart.promoPlaceholder")}
          className="input"
        />
        <button
          type="button"
          onClick={apply}
          disabled={pending || code.trim().length === 0}
          className="btn btn-dark shrink-0"
        >
          {pending ? "…" : t("cart.apply")}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-xs font-semibold text-danger-fg">{error}</p>
      ) : null}
      {message && !error ? (
        <p className="mt-2 text-xs font-semibold text-success-fg">{message}</p>
      ) : null}
      <p className="mt-2 text-[11px] text-fg-subtle">
        {t("cart.tryCodes", { codes: "WELCOME10, SAVE20, TECHDEAL" })}
      </p>
    </div>
  );
}
