"use client";

import { useActionState, useState } from "react";
import { Check, Star } from "lucide-react";
import { submitReviewAction, type ReviewState } from "@/lib/actions/reviews";
import { useI18n } from "@/components/i18n-provider";

export function ReviewForm({
  productId,
  canReview,
  signedIn,
}: {
  productId: string;
  canReview: boolean;
  signedIn: boolean;
}) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(
    submitReviewAction,
    {},
  );
  const [rating, setRating] = useState(5);

  if (!signedIn) {
    return (
      <div className="card p-5 text-sm text-fg-muted">
        <a
          href="/login?next=/products"
          className="font-semibold text-brand-fg hover:underline"
        >
          {t("auth.signIn")}
        </a>{" "}
        {t("product.signInToReview")}
      </div>
    );
  }

  if (!canReview) {
    return (
      <div className="card p-5 text-sm text-fg-muted">
        {t("product.alreadyReviewed")}
      </div>
    );
  }

  return (
    <form action={formAction} className="card p-5">
      <h3 className="text-sm font-bold text-fg">{t("product.writeReview")}</h3>

      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="mt-4">
        <p className="label">{t("product.yourRating")}</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              className="transition"
            >
              <Star
                className={`h-6 w-6 ${
                  value <= rating
                    ? "text-amber-400"
                    : "text-ink-200"
                }`}
                fill="currentColor"
              />
            </button>
          ))}
          <span className="ml-2 text-xs text-fg-muted">{rating} / 5</span>
        </div>
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="review-title">
          {t("product.reviewTitle")}
        </label>
        <input
          id="review-title"
          name="title"
          required
          minLength={3}
          className="input"
          placeholder={t("product.reviewTitlePlaceholder")}
        />
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="review-body">
          {t("product.reviewBody")}
        </label>
        <textarea
          id="review-body"
          name="body"
          required
          minLength={10}
          rows={4}
          className="input resize-y"
          placeholder={t("product.reviewBodyPlaceholder")}
        />
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary mt-4">
        {pending ? t("product.publishing") : t("product.publishReview")}
      </button>

      {state.error ? (
        <p className="mt-3 text-xs font-semibold text-danger-fg">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-success-fg">
          <Check className="h-3.5 w-3.5" /> {state.success}
        </p>
      ) : null}
    </form>
  );
}
