"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { toggleWishlistAction } from "@/lib/actions/cart";
import { useI18n } from "@/components/i18n-provider";

export function WishlistButton({
  productId,
  slug,
  saved,
  className = "",
}: {
  productId: string;
  slug: string;
  saved: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const [isSaved, setIsSaved] = useState(saved);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    startTransition(async () => {
      const result = await toggleWishlistAction(productId);
      if (result && "requiresAuth" in result && result.requiresAuth) {
        router.push(`/login?next=${encodeURIComponent(`/products/${slug}`)}`);
        return;
      }
      if (result && "saved" in result) setIsSaved(result.saved ?? false);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={isSaved}
      aria-label={isSaved ? t("product.unsave") : t("product.save")}
      title={isSaved ? t("product.unsave") : t("product.save")}
      className={`rounded-lg border border-line-strong bg-surface p-2 text-fg-muted transition hover:border-line-strong hover:text-fg disabled:opacity-60 ${className}`}
    >
      <Heart
        className={`h-4 w-4 ${isSaved ? "fill-rose-500 text-rose-500" : ""}`}
      />
    </button>
  );
}
