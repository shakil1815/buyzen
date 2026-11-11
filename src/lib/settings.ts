import { cookies } from "next/headers";
import {
  CURRENCIES,
  DEFAULT_USD_TO_BDT,
  type Currency,
} from "@/lib/currency";
import {
  CURRENCY_COOKIE,
  LOCALE_COOKIE,
  THEME_COOKIE,
} from "@/lib/constants";

export { CURRENCIES };
export type { Currency };
export { CURRENCY_COOKIE, LOCALE_COOKIE, THEME_COOKIE };

export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const USD_TO_BDT = Number(
  process.env.USD_TO_BDT_RATE ?? DEFAULT_USD_TO_BDT,
);

export async function getLocaleCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(LOCALE_COOKIE)?.value;
}

export async function getCurrency(): Promise<Currency> {
  const store = await cookies();
  const value = store.get(CURRENCY_COOKIE)?.value;
  return CURRENCIES.includes(value as Currency) ? (value as Currency) : "USD";
}

export async function getTheme(): Promise<Theme> {
  const store = await cookies();
  const value = store.get(THEME_COOKIE)?.value;
  return THEMES.includes(value as Theme) ? (value as Theme) : "system";
}
