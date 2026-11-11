export const CURRENCIES = ["USD", "BDT"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Fallback exchange rate (1 USD = 120 BDT) used when no rate is supplied. */
export const DEFAULT_USD_TO_BDT = 120;

export function usdToBdtRate() {
  const value = Number(process.env.USD_TO_BDT_RATE ?? DEFAULT_USD_TO_BDT);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_USD_TO_BDT;
}
