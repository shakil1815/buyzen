import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-fg-strong">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-fg-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card p-5 ${className}`}>
      {title ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-fg">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-fg-muted">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

const STATUS_STYLES: Record<string, string> = {
  green: "bg-success-soft text-success-fg",
  blue: "bg-brand-soft text-brand-fg",
  amber: "bg-warn-soft text-warn-fg",
  red: "bg-danger-soft text-danger-fg",
  grey: "bg-surface-3 text-fg-muted",
  info: "bg-info-soft text-info-fg",
};

export function StatusBadge({
  children,
  tone = "grey",
}: {
  children: React.ReactNode;
  tone?: keyof typeof STATUS_STYLES;
}) {
  return <span className={`badge ${STATUS_STYLES[tone]}`}>{children}</span>;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-surface-3 text-fg-subtle">
        <Inbox className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-fg">{title}</p>
      {description ? (
        <p className="max-w-sm text-xs text-fg-muted">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  basePath,
  params = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    search.set("page", String(target));
    return `${basePath}?${search.toString()}`;
  };

  const windowStart = Math.max(1, page - 2);
  const windowEnd = Math.min(totalPages, windowStart + 4);
  const pages: number[] = [];
  for (let index = windowStart; index <= windowEnd; index += 1) pages.push(index);

  return (
    <nav className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
      <p className="text-fg-muted">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={href(Math.max(1, page - 1))}
          aria-disabled={page === 1}
          className={`rounded-lg border border-line px-2.5 py-1.5 transition ${
            page === 1
              ? "pointer-events-none opacity-40"
              : "text-fg-muted hover:bg-surface-2"
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        {pages.map((item) => (
          <Link
            key={item}
            href={href(item)}
            className={`rounded-lg border px-2.5 py-1.5 font-semibold transition ${
              item === page
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-line text-fg-muted hover:bg-surface-2"
            }`}
          >
            {item}
          </Link>
        ))}
        <Link
          href={href(Math.min(totalPages, page + 1))}
          aria-disabled={page === totalPages}
          className={`rounded-lg border border-line px-2.5 py-1.5 transition ${
            page === totalPages
              ? "pointer-events-none opacity-40"
              : "text-fg-muted hover:bg-surface-2"
          }`}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </nav>
  );
}

export function DataTable({
  head,
  children,
}: {
  head: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[42rem] text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wide text-fg-subtle">
          <tr>
            {head.map((label) => (
              <th key={label} className="px-3 py-2.5 font-semibold">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>
  );
}
