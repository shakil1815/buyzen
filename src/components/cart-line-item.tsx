"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { removeItemAction, updateItemAction } from "@/lib/actions/cart";
import { formatMoney } from "@/lib/format";

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
      className={`flex gap-4 border-b border-ink-100 py-5 last:border-0 ${pending ? "opacity-60" : ""}`}
    >
      <Link
        href={`/products/${item.product.slug}`}
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-50"
      >
        <Image
          src={item.product.image}
          alt={item.product.name}
          fill
          sizes="96px"
          className="object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/products/${item.product.slug}`}
            className="text-sm font-semibold text-ink-900 hover:text-brand-600"
          >
            {item.product.name}
          </Link>
          <p className="shrink-0 text-sm font-bold text-ink-950">
            {formatMoney(item.product.price * item.quantity)}
          </p>
        </div>

        <p className="mt-1 text-xs text-ink-500">
          {formatMoney(item.product.price)} each
        </p>

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center rounded-lg border border-ink-200">
            <button
              type="button"
              onClick={() => setQuantity(item.quantity - 1)}
              className="px-3 py-1.5 text-base leading-none text-ink-500 transition hover:text-ink-900"
              aria-label="Decrease quantity"
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
              className="px-3 py-1.5 text-base leading-none text-ink-500 transition hover:text-ink-900 disabled:opacity-40"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-400 transition hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        </div>
      </div>
    </div>
  );
}
