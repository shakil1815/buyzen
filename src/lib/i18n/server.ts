import {
  dictionaries,
  defaultLocale,
  locales,
  type Dictionary,
  type Locale,
  type TranslationKey,
} from "@/lib/i18n/dictionaries";
import { interpolate } from "@/lib/i18n/interpolate";
import { getLocaleCookie } from "@/lib/settings";

export { interpolate };

export async function getLocale(): Promise<Locale> {
  const value = await getLocaleCookie();
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}

/** Intl locale used for date formatting. */
export async function getDateLocale(): Promise<string> {
  return (await getLocale()) === "bn" ? "bn-BD" : "en-US";
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()] ?? dictionaries[defaultLocale];
}

export type TranslateFn = (
  key: TranslationKey,
  values?: Record<string, string | number>,
) => string;

export async function getT(): Promise<TranslateFn> {
  const dictionary = await getDictionary();
  return (key, values) => interpolate(dictionary[key] ?? key, values);
}

/** Translates a category slug, falling back to the database name. */
export function categoryLabel(
  t: TranslateFn,
  slug: string,
  fallback: string,
): string {
  const key = `category.${slug}` as TranslationKey;
  const label = t(key);
  return label === key ? fallback : label;
}
