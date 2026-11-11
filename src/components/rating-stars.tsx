"use client";

import { Star } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

export function RatingStars({
  rating,
  count,
  size = "sm",
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const { t } = useI18n();
  const pixel = size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5";
  const rounded = Math.round(rating * 2) / 2;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rounded >= star;
          const half = !filled && rounded >= star - 0.5;
          return (
            <span key={star} className="relative inline-flex">
              <Star className={`${pixel} text-ink-200`} fill="currentColor" />
              {filled || half ? (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: half ? "50%" : "100%" }}
                >
                  <Star
                    className={`${pixel} text-amber-400`}
                    fill="currentColor"
                  />
                </span>
              ) : null}
            </span>
          );
        })}
      </div>
      <span className="text-xs font-medium text-fg-muted">
        {rating > 0 ? rating.toFixed(1) : t("product.new")}
        {typeof count === "number" ? ` (${count})` : ""}
      </span>
    </div>
  );
}
