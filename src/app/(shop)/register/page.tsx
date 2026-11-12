import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { getSession } from "@/lib/session";
import { AuthForm } from "@/components/auth-form";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a BuyZen account to track orders and save favourites.",
};

const BENEFITS = [
  "auth.benefit1",
  "auth.benefit2",
  "auth.benefit3",
  "auth.benefit4",
] as const;

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/account");

  const t = await getT();

  return (
    <div className="container-page grid gap-12 py-14 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-black tracking-tight text-fg-strong">
          {t("auth.registerTitle")}
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          {t("auth.registerBody", { code: "WELCOME10" })}
        </p>

        <div className="mt-8 card p-6">
          <AuthForm mode="register" />
        </div>
      </div>

      <div className="hidden flex-col justify-center gap-6 rounded-3xl border border-line bg-surface-2/70 p-10 lg:flex">
        <h2 className="text-2xl font-black tracking-tight text-fg-strong">
          {t("auth.benefitsTitle")}
        </h2>
        <ul className="space-y-3.5">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-3 text-sm text-fg-muted"
            >
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                <Check className="h-3 w-3" />
              </span>
              {t(benefit)}
            </li>
          ))}
        </ul>
        <p className="text-xs text-fg-muted">{t("auth.guestNote")}</p>
      </div>
    </div>
  );
}
