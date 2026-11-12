import { formatMoney } from "@/lib/format";

export type ChartPoint = {
  label: string;
  value: number;
  hint?: string;
};

const GRID = "#e7e9ef";
const AXIS = "#8695ac";

export function BarChart({
  points,
  height = 160,
  currency = "USD",
  rate = 120,
  valueLabel = "Revenue",
}: {
  points: ChartPoint[];
  height?: number;
  currency?: "USD" | "BDT";
  rate?: number;
  valueLabel?: string;
}) {
  if (points.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-fg-muted">No data in range.</p>
    );
  }

  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <div>
      <div
        className="relative flex items-end gap-1"
        style={{ height: `${height}px` }}
      >
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <span
            key={ratio}
            className="pointer-events-none absolute inset-x-0 border-t border-dashed"
            style={{ bottom: `${ratio * 100}%`, borderColor: GRID }}
          />
        ))}
        {points.map((point, index) => {
          const barHeight = Math.max(
            2,
            Math.round((point.value / max) * (height - 12)),
          );
          return (
            <div
              key={`${point.label}-${index}`}
              className="group relative flex h-full flex-1 items-end"
              title={`${point.label}: ${formatMoney(point.value, currency, rate)} ${valueLabel}`}
            >
              <div
                className="w-full rounded-t-md bg-brand-500/30 transition group-hover:bg-brand-500"
                style={{ height: `${barHeight}px` }}
              />
              <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface px-2 py-1 text-[10px] font-semibold text-fg shadow-lift group-hover:block">
                {formatMoney(point.value, currency, rate)}
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

export function LineChart({
  points,
  height = 180,
  currency = "USD",
  rate = 120,
}: {
  points: ChartPoint[];
  height?: number;
  currency?: "USD" | "BDT";
  rate?: number;
}) {
  if (points.length < 2) {
    return (
      <p className="py-10 text-center text-sm text-fg-muted">Not enough data.</p>
    );
  }

  const width = 720;
  const padding = 16;
  const max = Math.max(...points.map((point) => point.value), 1);
  const step = (width - padding * 2) / (points.length - 1);

  const coords = points.map((point, index) => ({
    x: padding + index * step,
    y: height - padding - (point.value / max) * (height - padding * 2),
  }));

  const path = coords
    .map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x},${coord.y}`)
    .join(" ");
  const area = `${path} L${coords[coords.length - 1].x},${height - padding} L${coords[0].x},${height - padding} Z`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Trend chart"
      >
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3366ff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#3366ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding}
            x2={width - padding}
            y1={height - padding * ratio}
            y2={height - padding * ratio}
            stroke={GRID}
            strokeDasharray="4 4"
          />
        ))}
        <path d={area} fill="url(#lineFill)" />
        <path d={path} fill="none" stroke="#3366ff" strokeWidth={2.5} />
        {coords.map((coord, index) => (
          <g key={points[index].label}>
            <circle
              cx={coord.x}
              cy={coord.y}
              r={3.5}
              fill="#ffffff"
              stroke="#3366ff"
              strokeWidth={2}
            >
              <title>
                {`${points[index].label}: ${formatMoney(points[index].value, currency, rate)}`}
              </title>
            </circle>
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] font-medium uppercase tracking-wide text-fg-subtle">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export function DonutChart({
  slices,
  size = 150,
  currency = "USD",
  rate = 120,
}: {
  slices: { label: string; value: number; color: string }[];
  size?: number;
  currency?: "USD" | "BDT";
  rate?: number;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;

  // Pre-compute the dash offsets so nothing is mutated during render.
  const arcs = slices.reduce<
    Array<{ label: string; value: number; color: string; length: number; offset: number }>
  >((accumulator, slice) => {
    const length = total > 0 ? (slice.value / total) * circumference : 0;
    const previous = accumulator[accumulator.length - 1];
    const offset = previous ? previous.offset + previous.length : 0;
    accumulator.push({ ...slice, length, offset });
    return accumulator;
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width={size} height={size} role="img" aria-label="Distribution chart">
        <g transform={`translate(${size / 2} ${size / 2}) rotate(-90)`}>
          <circle
            r={radius}
            fill="none"
            stroke={GRID}
            strokeWidth={18}
          />
          {arcs.map((slice) => (
            <circle
              key={slice.label}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={18}
              strokeDasharray={`${slice.length} ${circumference - slice.length}`}
              strokeDashoffset={-slice.offset}
            >
              <title>{`${slice.label}: ${slice.value}`}</title>
            </circle>
          ))}
        </g>
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          className="fill-fg-strong text-lg font-black"
        >
          {total}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 18}
          textAnchor="middle"
          className="fill-fg-subtle text-[10px] font-semibold uppercase"
        >
          total
        </text>
      </svg>

      <ul className="space-y-1.5 text-xs">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-fg-muted">{slice.label}</span>
            <span className="font-semibold text-fg">
              {currency === "BDT"
                ? formatMoney(slice.value, currency, rate)
                : slice.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HorizontalBars({
  points,
  currency = "USD",
  rate = 120,
}: {
  points: ChartPoint[];
  currency?: "USD" | "BDT";
  rate?: number;
}) {
  const max = Math.max(...points.map((point) => point.value), 1);

  return (
    <ul className="space-y-3">
      {points.map((point) => (
        <li key={point.label}>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="truncate text-fg">{point.label}</span>
            <span className="shrink-0 font-semibold text-fg">
              {point.hint ?? formatMoney(point.value, currency, rate)}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${Math.max(2, (point.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export const CHART_COLORS = [
  "#3366ff",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#64748b",
];

export { AXIS };
