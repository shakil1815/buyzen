import { DEFAULT_USD_TO_BDT, type Currency } from "@/lib/currency";

export function formatMoney(
  cents: number,
  currency: Currency = "USD",
  rate: number = DEFAULT_USD_TO_BDT,
) {
  if (currency === "BDT") {
    const taka = Math.round((cents / 100) * rate);
    const formatted = new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(taka);
    return `৳${formatted}`;
  }

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

  return `$${formatted}`;
}

/** Converts a USD cent amount into the selected currency's minor unit. */
export function convertAmount(
  cents: number,
  currency: Currency = "USD",
  rate: number = DEFAULT_USD_TO_BDT,
) {
  if (currency === "BDT") {
    return Math.round((cents / 100) * rate);
  }
  return cents;
}

export function formatDate(date: Date | string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function discountPercent(price: number, compareAtPrice?: number | null) {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
