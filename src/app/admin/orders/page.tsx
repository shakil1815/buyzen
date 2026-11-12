import Link from "next/link";
import { Download, Search } from "lucide-react";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";
import { formatDate, formatMoney } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUSES,
  statusTone,
} from "@/lib/orders";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Pagination,
  Panel,
  StatusBadge,
  Toolbar,
} from "@/components/admin/ui";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage(props: PageProps<"/admin/orders">) {
  await requirePermission("orders.view");
  const searchParams = (await props.searchParams) as Record<
    string,
    string | string[] | undefined
  >;
  const pick = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  };

  const status = pick("status");
  const paymentStatus = pick("paymentStatus");
  const method = pick("method");
  const query = pick("q");
  const page = Math.max(Number(pick("page")) || 1, 1);
  const perPage = 25;

  const where = {
    ...(status ? { status } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(method ? { paymentMethod: method } : {}),
    ...(query
      ? {
          OR: [
            { number: { contains: query } },
            { email: { contains: query } },
            { shippingName: { contains: query } },
            { phone: { contains: query } },
            { trackingNumber: { contains: query } },
          ],
        }
      : {}),
  };

  const [orders, total, currency] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.order.count({ where }),
    getCurrency(),
  ]);
  const rate = usdToBdtRate();
  const money = (cents: number) => formatMoney(cents, currency, rate);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description={`${total} order${total === 1 ? "" : "s"} matching the filters`}
        actions={
          <Link
            href={`/api/admin/export/orders?${new URLSearchParams(
              query ? { q: query } : {},
            ).toString()}`}
            className="btn btn-outline"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Link>
        }
      />

      <Panel>
        <Toolbar>
          <form
            method="get"
            action="/admin/orders"
            className="flex flex-1 flex-wrap items-center gap-2"
          >
            <div className="relative min-w-[12rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search order no, name, email, phone, tracking…"
                className="input pl-9"
                aria-label="Search orders"
              />
            </div>
            <select
              name="status"
              defaultValue={status}
              className="input w-auto"
              aria-label="Filter by order status"
            >
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {ORDER_STATUS_LABELS[item]}
                </option>
              ))}
            </select>
            <select
              name="paymentStatus"
              defaultValue={paymentStatus}
              className="input w-auto"
              aria-label="Filter by payment status"
            >
              <option value="">All payment states</option>
              {PAYMENT_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              name="method"
              defaultValue={method}
              className="input w-auto"
              aria-label="Filter by payment method"
            >
              <option value="">All methods</option>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-dark">
              Apply
            </button>
          </form>
        </Toolbar>

        {orders.length === 0 ? (
          <EmptyState title="No orders match these filters" />
        ) : (
          <>
            <DataTable
              head={[
                "Order",
                "Customer",
                "Date",
                "Products",
                "Total",
                "Payment",
                "Status",
                "Delivery",
              ]}
            >
              {orders.map((order) => (
                <tr key={order.id} className="transition hover:bg-surface-2/60">
                  <td className="px-3 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-fg hover:text-brand-fg"
                    >
                      {order.number}
                    </Link>
                    <p className="text-[11px] text-fg-subtle">
                      {order.invoiceNumber ?? "—"}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-fg">{order.shippingName}</p>
                    <p className="text-[11px] text-fg-subtle">{order.email}</p>
                  </td>
                  <td className="px-3 py-3 text-fg-muted">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-3 py-3 text-fg-muted">
                    {order.items.length} item{order.items.length === 1 ? "" : "s"}
                  </td>
                  <td className="px-3 py-3 font-semibold text-fg">
                    {money(order.total)}
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-fg-muted">
                      {PAYMENT_METHOD_LABELS[order.paymentMethod] ??
                        order.paymentMethod}
                    </p>
                    <StatusBadge tone={statusTone(order.paymentStatus)}>
                      {order.paymentStatus}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge tone={statusTone(order.status)}>
                      {ORDER_STATUS_LABELS[
                        order.status as keyof typeof ORDER_STATUS_LABELS
                      ] ?? order.status}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-3 text-fg-muted">
                    <p>{order.city}</p>
                    <p className="text-[11px] text-fg-subtle">
                      {order.trackingNumber ?? "No tracking yet"}
                    </p>
                  </td>
                </tr>
              ))}
            </DataTable>

            <Pagination
              page={page}
              totalPages={totalPages}
              basePath="/admin/orders"
              params={{
                q: query || undefined,
                status: status || undefined,
                paymentStatus: paymentStatus || undefined,
                method: method || undefined,
              }}
            />
          </>
        )}
      </Panel>
    </div>
  );
}
