import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { getSession } from "@/lib/session";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a ShopFront account to track orders and save favourites.",
};

const BENEFITS = [
  "Track every order from warehouse to doorstep",
  "Save products to your wishlist for later",
  "Write reviews and get member-only promo codes",
  "Checkout in seconds with saved details",
];

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/account");

  return (
    <div className="container-page grid gap-12 py-14 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-black tracking-tight text-ink-950">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          It takes less than a minute and you get 10% off your first order with
          code <strong className="text-ink-800">WELCOME10</strong>.
        </p>

        <div className="mt-8 card p-6">
          <AuthForm mode="register" />
        </div>
      </div>

      <div className="hidden flex-col justify-center gap-6 rounded-3xl border border-ink-100 bg-ink-50/70 p-10 lg:flex">
        <h2 className="text-2xl font-black tracking-tight text-ink-950">
          Why join ShopFront?
        </h2>
        <ul className="space-y-3.5">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3 text-sm text-ink-700">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                <Check className="h-3 w-3" />
              </span>
              {benefit}
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-500">
          Already shopping as a guest? You can check out without an account —
          {" "}
          <Link href="/products" className="font-semibold text-brand-600">
            continue to the catalogue
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
