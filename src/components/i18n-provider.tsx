"use client";

import { createContext, useContext, useMemo } from "react";
import type { Dictionary, Locale, TranslationKey } from "@/lib/i18n/dictionaries";
import { interpolate } from "@/lib/i18n/interpolate";
import type { Currency } from "@/lib/currency";

type I18nContextValue = {
  locale: Locale;
  dictionary: Dictionary;
  currency: Currency;
  usdToBdt: number;
  t: (
    key: TranslationKey,
    values?: Record<string, string | number>,
  ) => string;
  categoryName: (slug: string, fallback: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  dictionary,
  currency,
  usdToBdt,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  currency: Currency;
  usdToBdt: number;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dictionary,
      currency,
      usdToBdt,
      t: (key, values) => interpolate(dictionary[key] ?? key, values),
      categoryName: (slug, fallback) => {
        const key = `category.${slug}` as TranslationKey;
        const label = dictionary[key];
        return label ?? fallback;
      },
    }),
    [locale, dictionary, currency, usdToBdt],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside <I18nProvider>");
  }
  return context;
}
