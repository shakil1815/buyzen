"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { toggleWishlistAction } from "@/lib/actions/cart";

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
      aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
      title={isSaved ? "Remove from wishlist" : "Save to wishlist"}
      className={`rounded-lg border border-ink-200 bg-white p-2 text-ink-500 transition hover:border-ink-300 hover:text-ink-800 disabled:opacity-60 ${className}`}
    >
      <Heart
        className={`h-4 w-4 ${isSaved ? "fill-rose-500 text-rose-500" : ""}`}
      />
    </button>
  );
}
