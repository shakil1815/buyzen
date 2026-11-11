"use client";

import { useState, useTransition } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { addItemAction } from "@/lib/actions/cart";
import { useI18n } from "@/components/i18n-provider";

export function AddToCart({
  productId,
  disabled,
  max = 10,
  label = "Add to cart",
  variant = "primary",
  compact = false,
}: {
  productId: string;
  disabled?: boolean;
  max?: number;
  label?: string;
  variant?: "primary" | "dark" | "outline";
  compact?: boolean;
}) {
  const { t } = useI18n();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function add() {
    startTransition(async () => {
      await addItemAction(productId, quantity);
      setAdded(true);
      router.refresh();
      setTimeout(() => setAdded(false), 1800);
    });
  }

  const className =
    variant === "primary"
      ? "btn btn-primary"
      : variant === "dark"
        ? "btn btn-dark"
        : "btn btn-outline";

  return (
    <div
      className={
        compact ? "flex items-center gap-2" : "flex flex-wrap items-center gap-3"
      }
    >
      {compact ? null : (
        <div className="flex items-center rounded-xl border border-line-strong">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="px-3 py-2 text-lg leading-none text-fg-muted transition hover:text-fg-strong"
            aria-label={t("cart.decrease")}
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(max, value + 1))}
            className="px-3 py-2 text-lg leading-none text-fg-muted transition hover:text-fg-strong"
            aria-label={t("cart.increase")}
          >
            +
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={add}
        disabled={disabled || pending}
        className={`${className} ${compact ? "px-3 py-2 text-xs" : "min-w-[9.5rem]"}`}
        aria-label={compact ? t("product.addToCart") : undefined}
      >
        {added ? (
          <>
            <Check className="h-4 w-4" />
            {t("product.added")}
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" />
            {pending ? "…" : label}
          </>
        )}
      </button>
    </div>
  );
}
