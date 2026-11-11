"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { locales } from "@/lib/i18n/dictionaries";
import {
  CURRENCY_COOKIE,
  CURRENCIES,
  LOCALE_COOKIE,
} from "@/lib/settings";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setLocaleAction(locale: string) {
  if (!locales.includes(locale as (typeof locales)[number])) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

export async function setCurrencyAction(currency: string) {
  if (!CURRENCIES.includes(currency as (typeof CURRENCIES)[number])) return;
  const store = await cookies();
  store.set(CURRENCY_COOKIE, currency, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
