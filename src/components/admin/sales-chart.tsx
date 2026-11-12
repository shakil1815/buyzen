import { formatMoney } from "@/lib/format";

export type SalesPoint = {
  label: string;
  revenue: number;
  orders: number;
};

/** Lightweight bar chart - no chart library needed. */
export function SalesChart({
  points,
  currency = "USD",
  rate = 120,
}: {
  points: SalesPoint[];
  currency?: "USD" | "BDT";
  rate?: number;
}) {
  if (points.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-fg-muted">
        No sales recorded yet.
      </p>
    );
  }

  const max = Math.max(...points.map((point) => point.revenue), 1);

  return (
    <div>
      <div className="flex h-40 items-end gap-1.5">
        {points.map((point, index) => {
          const height = Math.max(
            3,
            Math.round((point.revenue / max) * 100),
          );
          return (
            <div
              key={point.label + index}
              className="group relative flex h-full flex-1 items-end"
              title={`${point.label}: ${formatMoney(point.revenue, currency, rate)} · ${point.orders} order(s)`}
            >
              <div
                className="w-full rounded-t-md bg-brand-500/30 transition group-hover:bg-brand-500"
                style={{ height: `${height}%` }}
              />
              <span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface px-2 py-1 text-[10px] font-semibold text-fg shadow-lift group-hover:block">
                {formatMoney(point.revenue, currency, rate)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-wide text-fg-subtle">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}
