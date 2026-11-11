"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { loginAction, registerAction, type AuthState } from "@/lib/actions/auth";
import { useI18n } from "@/components/i18n-provider";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t } = useI18n();
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {mode === "register" ? (
        <div>
          <label className="label" htmlFor="name">
            {t("auth.name")}
          </label>
          <input id="name" name="name" required className="input" />
        </div>
      ) : null}

      <div>
        <label className="label" htmlFor="email">
          {t("auth.email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          {t("auth.password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : 1}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="input"
        />
        {mode === "register" ? (
          <p className="mt-1.5 text-[11px] text-fg-subtle">
            {t("auth.passwordHint")}
          </p>
        ) : null}
      </div>

      {state.error ? (
        <p className="flex items-center gap-2 rounded-xl border border-rose-200 bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger-fg">
          <AlertCircle className="h-4 w-4 shrink-0" /> {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary w-full py-3"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> {t("auth.signingIn")}
          </>
        ) : mode === "login" ? (
          t("auth.signIn")
        ) : (
          t("auth.register")
        )}
      </button>

      <p className="text-center text-xs text-fg-muted">
        {mode === "login" ? (
          <>
            {t("auth.newTo")}{" "}
            <Link href="/register" className="font-semibold text-brand-fg">
              {t("auth.register")}
            </Link>
          </>
        ) : (
          <>
            {t("auth.already")}{" "}
            <Link href="/login" className="font-semibold text-brand-fg">
              {t("auth.signIn")}
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
