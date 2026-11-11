import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, Sparkles, Truck } from "lucide-react";
import { getSession } from "@/lib/session";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your ShopFront account.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/account");

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
        <h1 className="text-3xl font-black tracking-tight text-ink-950">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Sign in to track orders, save favourites and check out faster.
        </p>

        <div className="mt-8 card p-6">
          <AuthForm mode="login" />
        </div>

        {next ? (
          <p className="mt-4 text-center text-xs text-ink-500">
            You&apos;ll be redirected to <strong>{next}</strong> after signing in.
          </p>
        ) : null}

        <div className="mt-6 rounded-xl bg-ink-50 p-4 text-xs leading-relaxed text-ink-500">
          <p className="font-semibold text-ink-700">Demo accounts</p>
          <p className="mt-1">
            Customer: <code>customer@example.com</code> /{" "}
            <code>customer123</code>
          </p>
          <p>
            Admin: <code>admin@shopfront.dev</code> / <code>admin12345</code>
          </p>
        </div>
      </div>

      <div className="hidden flex-col justify-center gap-6 rounded-3xl bg-ink-950 p-10 text-white lg:flex">
        <span className="badge w-fit bg-white/10 text-brand-200">
          <Sparkles className="h-3 w-3" /> Members get more
        </span>
        <h2 className="text-3xl font-black leading-tight tracking-tight">
          Everything you buy, in one place.
        </h2>
        <ul className="space-y-4 text-sm text-ink-300">
          <li className="flex gap-3">
            <Truck className="h-5 w-5 shrink-0 text-brand-300" />
            Order tracking with live delivery updates
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-brand-300" />
            Wishlist, reviews and faster checkout
          </li>
          <li className="flex gap-3">
            <Sparkles className="h-5 w-5 shrink-0 text-brand-300" />
            Members-only promo codes every month
          </li>
        </ul>
        <Link href="/products" className="btn btn-primary w-fit">
          Browse the catalogue
        </Link>
      </div>
    </div>
  );
}
