"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { removeItemAction, updateItemAction } from "@/lib/actions/cart";
import { formatMoney } from "@/lib/format";
import { useI18n } from "@/components/i18n-provider";
import { ProductImage } from "@/components/product-image";

export function CartLineItem({
  item,
}: {
  item: {
    id: string;
    quantity: number;
    product: {
      name: string;
      slug: string;
      price: number;
      image: string;
      stock: number;
    };
  };
}) {
  const { t, currency, usdToBdt } = useI18n();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function setQuantity(quantity: number) {
    startTransition(async () => {
      await updateItemAction(item.id, quantity);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await removeItemAction(item.id);
      router.refresh();
    });
  }

  return (
    <div
      className={`flex gap-4 border-b border-line py-5 last:border-0 ${pending ? "opacity-60" : ""}`}
    >
      <Link
        href={`/products/${item.product.slug}`}
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-2"
      >
        <ProductImage
          src={item.product.image}
          alt={item.product.name}
          fill
          sizes="96px"
          className="object-contain p-1.5"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <Link
            href={`/products/${item.product.slug}`}
            className="text-sm font-semibold text-fg hover:text-brand-fg"
          >
            {item.product.name}
          </Link>
          <p className="shrink-0 text-sm font-bold text-fg-strong">
            {formatMoney(item.product.price * item.quantity, currency, usdToBdt)}
          </p>
        </div>

        <p className="mt-1 text-xs text-fg-muted">
          {t("cart.each", {
            price: formatMoney(item.product.price, currency, usdToBdt),
          })}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          <div className="flex items-center rounded-lg border border-line-strong">
            <button
              type="button"
              onClick={() => setQuantity(item.quantity - 1)}
              className="px-3 py-1.5 text-base leading-none text-fg-muted transition hover:text-fg-strong"
              aria-label={t("cart.decrease")}
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(item.quantity + 1)}
              disabled={item.quantity >= item.product.stock}
              className="px-3 py-1.5 text-base leading-none text-fg-muted transition hover:text-fg-strong disabled:opacity-40"
              aria-label={t("cart.increase")}
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg-subtle transition hover:text-danger-fg"
          >
            <Trash2 className="h-3.5 w-3.5" /> {t("cart.removeItem")}
          </button>
        </div>
      </div>
    </div>
  );
}
