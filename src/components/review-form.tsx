"use client";

import { useActionState, useState } from "react";
import { Check, Star } from "lucide-react";
import { submitReviewAction, type ReviewState } from "@/lib/actions/reviews";

export function ReviewForm({
  productId,
  canReview,
  signedIn,
}: {
  productId: string;
  canReview: boolean;
  signedIn: boolean;
}) {
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(
    submitReviewAction,
    {},
  );
  const [rating, setRating] = useState(5);

  if (!signedIn) {
    return (
      <div className="card p-5 text-sm text-ink-600">
        <a
          href="/login?next=/products"
          className="font-semibold text-brand-600 hover:underline"
        >
          Sign in
        </a>{" "}
        to share your experience with this product.
      </div>
    );
  }

  if (!canReview) {
    return (
      <div className="card p-5 text-sm text-ink-600">
        You have already reviewed this product. Thanks for the feedback!
      </div>
    );
  }

  return (
    <form action={formAction} className="card p-5">
      <h3 className="text-sm font-bold text-ink-900">Write a review</h3>

      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="mt-4">
        <p className="label">Your rating</p>
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
          <span className="ml-2 text-xs text-ink-500">{rating} / 5</span>
        </div>
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="review-title">
          Title
        </label>
        <input
          id="review-title"
          name="title"
          required
          minLength={3}
          className="input"
          placeholder="Sum it up in a few words"
        />
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="review-body">
          Your review
        </label>
        <textarea
          id="review-body"
          name="body"
          required
          minLength={10}
          rows={4}
          className="input resize-y"
          placeholder="What did you like or dislike? How did you use it?"
        />
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary mt-4">
        {pending ? "Publishing…" : "Publish review"}
      </button>

      {state.error ? (
        <p className="mt-3 text-xs font-semibold text-rose-600">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <Check className="h-3.5 w-3.5" /> {state.success}
        </p>
      ) : null}
    </form>
  );
}
