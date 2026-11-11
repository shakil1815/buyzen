"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Globe2,
  Languages,
  Monitor,
  Moon,
  Settings2,
  Sun,
} from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { useTheme } from "@/components/theme-provider";
import { setCurrencyAction, setLocaleAction } from "@/lib/actions/settings";
import type { Currency } from "@/lib/currency";

export function SettingsMenu({ compact = false }: { compact?: boolean }) {
  const { t, locale, currency } = useI18n();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function chooseLocale(next: string) {
    startTransition(async () => {
      await setLocaleAction(next);
      setOpen(false);
      router.refresh();
    });
  }

  function chooseCurrency(next: Currency) {
    startTransition(async () => {
      await setCurrencyAction(next);
      setOpen(false);
      router.refresh();
    });
  }

  const themeOptions = [
    { value: "light" as const, label: t("theme.light"), icon: Sun },
    { value: "dark" as const, label: t("theme.dark"), icon: Moon },
    { value: "system" as const, label: t("theme.system"), icon: Monitor },
  ];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={pending}
        aria-label={t("theme.toggle")}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-2 text-xs font-semibold text-fg-muted transition hover:border-brand-300 hover:text-fg"
      >
        {compact ? (
          <Settings2 className="h-4 w-4" />
        ) : (
          <>
            <Globe2 className="h-4 w-4" />
            <span>{locale === "bn" ? "বাংলা" : "EN"}</span>
            <span className="text-fg-subtle">·</span>
            <span>{currency === "BDT" ? "৳" : "$"}</span>
          </>
        )}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-surface p-2 shadow-lift">
          <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">
            {t("language.label")}
          </p>
          <div className="grid grid-cols-2 gap-1">
            {(
              [
                { value: "en", label: t("language.en") },
                { value: "bn", label: t("language.bn") },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => chooseLocale(option.value)}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition ${
                  locale === option.value
                    ? "bg-brand-600 text-white"
                    : "bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg"
                }`}
              >
                <Languages className="h-3.5 w-3.5" />
                {option.label}
              </button>
            ))}
          </div>

          <p className="px-2.5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">
            {t("currency.label")}
          </p>
          <div className="grid grid-cols-2 gap-1">
            {(
              [
                { value: "USD" as Currency, label: t("currency.usd") },
                { value: "BDT" as Currency, label: t("currency.bdt") },
              ]
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => chooseCurrency(option.value)}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition ${
                  currency === option.value
                    ? "bg-brand-600 text-white"
                    : "bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg"
                }`}
              >
                {currency === option.value ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className="h-3.5 w-3.5" />
                )}
                {option.label}
              </button>
            ))}
          </div>

          <p className="px-2.5 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">
            {t("theme.label")}
          </p>
          <div className="space-y-1">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                  theme === option.value
                    ? "bg-brand-soft text-brand-fg dark:bg-brand-soft0/15 dark:text-brand-200"
                    : "text-fg-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <option.icon className="h-3.5 w-3.5" />
                {option.label}
                {theme === option.value ? (
                  <Check className="ml-auto h-3.5 w-3.5" />
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
