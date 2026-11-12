import Link from "next/link";
import { Download, Search, Users } from "lucide-react";
import { requirePermission } from "@/lib/permissions";
import {
  SEGMENT_LABELS,
  SEGMENT_KEYS,
  getCustomerDirectory,
  getSegmentCounts,
} from "@/lib/admin/customers";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";
import { formatDate, formatMoney } from "@/lib/format";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Pagination,
  Panel,
  StatusBadge,
  Toolbar,
} from "@/components/admin/ui";

export const metadata = { title: "Customers" };

export default async function AdminCustomersPage(
  props: PageProps<"/admin/customers">,
) {
  await requirePermission("customers.view");
  const searchParams = (await props.searchParams) as Record<
    string,
    string | string[] | undefined
  >;
  const pick = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  };

  const query = {
    q: pick("q"),
    status: pick("status") || "all",
    segment: pick("segment") || "all",
    sort: pick("sort") || "newest",
    page: Number(pick("page")) || 1,
    perPage: Number(pick("perPage")) || 20,
  };

  const [directory, segmentCounts, currency] = await Promise.all([
    getCustomerDirectory(query),
    getSegmentCounts(),
    getCurrency(),
  ]);
  const rate = usdToBdtRate();
  const money = (cents: number) => formatMoney(cents, currency, rate);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer directory"
        description={`${directory.total} customer${directory.total === 1 ? "" : "s"} matching the current filters`}
        actions={
          <Link
            href={`/api/admin/export/customers?${new URLSearchParams({
              ...(query.q ? { q: query.q } : {}),
              ...(query.status !== "all" ? { status: query.status } : {}),
              ...(query.segment !== "all" ? { segment: query.segment } : {}),
            }).toString()}`}
            className="btn btn-outline"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Link>
        }
      />

      {/* Segment summary */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {SEGMENT_KEYS.map((key) => (
          <Link
            key={key}
            href={`/admin/customers?segment=${key}`}
            className={`card p-4 transition hover:shadow-lift ${
              query.segment === key ? "ring-2 ring-brand-500" : ""
            }`}
          >
            <p className="text-xl font-black tracking-tight text-fg-strong">
              {segmentCounts[key]}
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-fg-muted">
              {SEGMENT_LABELS[key]}
            </p>
          </Link>
        ))}
      </div>

      <Panel>
        <Toolbar>
          <form
            method="get"
            action="/admin/customers"
            className="flex flex-1 flex-wrap items-center gap-2"
          >
            <div className="relative min-w-[12rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
              <input
                name="q"
                defaultValue={query.q}
                placeholder="Search name, email, phone, city…"
                className="input pl-9"
                aria-label="Search customers"
              />
            </div>
            <select
              name="status"
              defaultValue={query.status}
              className="input w-auto"
              aria-label="Filter by account status"
            >
              <option value="all">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked</option>
            </select>
            <select
              name="segment"
              defaultValue={query.segment}
              className="input w-auto"
              aria-label="Filter by segment"
            >
              <option value="all">All segments</option>
              {SEGMENT_KEYS.map((key) => (
                <option key={key} value={key}>
                  {SEGMENT_LABELS[key]}
                </option>
              ))}
            </select>
            <select
              name="sort"
              defaultValue={query.sort}
              className="input w-auto"
              aria-label="Sort customers"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="spent">Highest spend</option>
              <option value="orders">Most orders</option>
              <option value="name">Name A–Z</option>
            </select>
            <button type="submit" className="btn btn-dark">
              Apply
            </button>
          </form>
        </Toolbar>

        {directory.rows.length === 0 ? (
          <EmptyState
            title="No customers match these filters"
            description="Try a different search term, status or segment."
            action={
              <Link href="/admin/customers" className="btn btn-outline mt-2">
                Reset filters
              </Link>
            }
          />
        ) : (
          <>
            <DataTable
              head={[
                "Customer",
                "Contact",
                "Location",
                "Registered",
                "Orders",
                "Total spend",
                "Last order",
                "Status",
                "Segments",
              ]}
            >
              {directory.rows.map((customer) => (
                <tr key={customer.id} className="transition hover:bg-surface-2/60">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft text-xs font-bold text-brand-fg">
                        {customer.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={customer.avatarUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          customer.name.slice(0, 1).toUpperCase()
                        )}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="block truncate font-medium text-fg hover:text-brand-fg"
                        >
                          {customer.name}
                        </Link>
                        <p className="truncate text-[11px] text-fg-subtle">
                          ID {customer.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p className="truncate text-fg">{customer.email}</p>
                    <p className="text-[11px] text-fg-subtle">
                      {customer.phone ?? "No phone"}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-fg-muted">
                    {customer.city ?? "—"}
                    {customer.district ? (
                      <span className="block text-[11px] text-fg-subtle">
                        {customer.district}
                        {customer.division ? `, ${customer.division}` : ""}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-fg-muted">
                    {formatDate(customer.createdAt)}
                  </td>
                  <td className="px-3 py-3 text-fg">{customer.orders}</td>
                  <td className="px-3 py-3 font-semibold text-fg">
                    {money(customer.spent)}
                  </td>
                  <td className="px-3 py-3 text-fg-muted">
                    {customer.lastOrder
                      ? formatDate(customer.lastOrder)
                      : "Never"}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge
                      tone={customer.status === "ACTIVE" ? "green" : "red"}
                    >
                      {customer.status}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {customer.segment.length === 0 ? (
                        <span className="text-[11px] text-fg-subtle">—</span>
                      ) : (
                        customer.segment.map((segment) => (
                          <span
                            key={segment}
                            className="badge bg-surface-3 text-fg-muted"
                          >
                            {SEGMENT_LABELS[segment]}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>

            <Pagination
              page={directory.page}
              totalPages={directory.totalPages}
              basePath="/admin/customers"
              params={{
                q: query.q || undefined,
                status: query.status !== "all" ? query.status : undefined,
                segment: query.segment !== "all" ? query.segment : undefined,
                sort: query.sort !== "newest" ? query.sort : undefined,
              }}
            />
          </>
        )}
      </Panel>

      <p className="flex items-center gap-2 text-[11px] text-fg-subtle">
        <Users className="h-3.5 w-3.5" />
        Passwords and authentication secrets are never exposed to the admin
        console.
      </p>
    </div>
  );
}
