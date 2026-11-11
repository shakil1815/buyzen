import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, Sparkles, Truck } from "lucide-react";
import { getSession } from "@/lib/session";
import { AuthForm } from "@/components/auth-form";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your ShopFront account.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/account");

  const t = await getT();

  const searchParams = (await props.searchParams) as Record<
    string,
    string | string[] | undefined
  >;
  const next = Array.isArray(searchParams.next)
    ? searchParams.next[0]
    : (searchParams.next ?? "");

  return (
    <div className="container-page grid gap-12 py-14 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-black tracking-tight text-fg-strong">
          {t("auth.loginTitle")}
        </h1>
        <p className="mt-2 text-sm text-fg-muted">{t("auth.loginBody")}</p>

        <div className="mt-8 card p-6">
          <AuthForm mode="login" />
        </div>

        {next ? (
          <p className="mt-4 text-center text-xs text-fg-muted">
            {t("auth.nextNotice", { next })}
          </p>
        ) : null}

        <div className="mt-6 rounded-xl bg-surface-2 p-4 text-xs leading-relaxed text-fg-muted">
          <p className="font-semibold text-fg-muted">{t("auth.demoTitle")}</p>
          <p className="mt-1">
            {t("auth.customer")}: <code>customer@example.com</code> /{" "}
            <code>customer123</code>
          </p>
          <p>
            {t("auth.admin")}: <code>admin@shopfront.dev</code> /{" "}
            <code>admin12345</code>
          </p>
        </div>
      </div>

      <div className="hidden flex-col justify-center gap-6 rounded-3xl bg-ink-950 p-10 text-white lg:flex">
        <span className="badge w-fit bg-surface/10 text-brand-200">
          <Sparkles className="h-3 w-3" /> {t("auth.membersGetMore")}
        </span>
        <h2 className="text-3xl font-black leading-tight tracking-tight">
          {t("auth.everythingInOne")}
        </h2>
        <ul className="space-y-4 text-sm text-fg-subtle">
          <li className="flex gap-3">
            <Truck className="h-5 w-5 shrink-0 text-brand-300" />
            {t("auth.benefit1")}
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-brand-300" />
            {t("auth.benefit2")}
          </li>
          <li className="flex gap-3">
            <Sparkles className="h-5 w-5 shrink-0 text-brand-300" />
            {t("auth.benefit3")}
          </li>
        </ul>
        <Link href="/products" className="btn btn-primary w-fit">
          {t("auth.browseCatalog")}
        </Link>
      </div>
    </div>
  );
}
