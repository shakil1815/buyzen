"use client";

import { useActionState } from "react";
import { Check, Send } from "lucide-react";
import { subscribeAction } from "@/lib/actions/reviews";

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeAction, {});

  return (
    <form action={formAction} className="mt-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary shrink-0"
        >
          {pending ? "Joining…" : "Subscribe"}
          <Send className="h-4 w-4" />
        </button>
      </div>
      {state.error ? (
        <p className="mt-2 text-xs font-medium text-rose-600">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <Check className="h-3.5 w-3.5" /> {state.success}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-ink-400">
        Weekly drops, members-only codes. Unsubscribe any time.
      </p>
    </form>
  );
}
