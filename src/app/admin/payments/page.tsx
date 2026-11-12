import Link from "next/link";
import { Download, Search, ShieldCheck } from "lucide-react";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";
import { formatDate, formatMoney } from "@/lib/format";
import { PAYMENT_METHOD_LABELS, statusTone } from "@/lib/orders";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Pagination,
  Panel,
  StatusBadge,
  Toolbar,
} from "@/components/admin/ui";
import {
  CollectCodButton,
  PaymentVerifyButton,
} from "@/components/admin/payment-actions";

export const metadata = { title: "Payments" };

export default async function AdminPaymentsPage(
  props: PageProps<"/admin/payments">,
) {
  await requirePermission("payments.view");
  const searchParams = (await props.searchParams) as Record<
    string,
    string | string[] | undefined
  >;
  const pick = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  };

  const status = pick("status");
  const method = pick("method");
  const query = pick("q");
  const page = Math.max(Number(pick("page")) || 1, 1);
  const perPage = 25;

  const where = {
    ...(status ? { status } : {}),
    ...(method ? { method } : {}),
    ...(query
      ? {
          OR: [
            { reference: { contains: query } },
            { senderNumber: { contains: query } },
            { order: { number: { contains: query } } },
          ],
        }
      : {}),
  };

  const [payments, total, pending, codOutstanding, currency] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { order: { select: { id: true, number: true, shippingName: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.payment.count({ where }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.order.count({
      where: { paymentMethod: "cod", paymentStatus: { not: "PAID" } },
    }),
    getCurrency(),
  ]);

  const rate = usdToBdtRate();
  const money = (cents: number) => formatMoney(cents, currency, rate);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Manual transactions, gateway payments and cash on delivery in one ledger."
        actions={
          <Link
            href={`/api/admin/export/payments`}
            className="btn btn-outline"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-2xl font-black tracking-tight text-fg-strong">
            {pending}
          </p>
          <p className="text-[11px] font-medium text-fg-muted">
            Awaiting manual verification
          </p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-black tracking-tight text-fg-strong">
            {codOutstanding}
          </p>
          <p className="text-[11px] font-medium text-fg-muted">
            Cash on delivery orders still to collect
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-fg">Manual methods</p>
          <p className="mt-1 text-[11px] text-fg-muted">
            bKash, Nagad and Rocket are verified by an admin before an order is
            treated as paid. SSLCommerz and the official merchant APIs are
            scaffolded but not connected to a live gateway.
          </p>
        </div>
      </div>

      <Panel>
        <Toolbar>
          <form
            method="get"
            action="/admin/payments"
            className="flex flex-1 flex-wrap items-center gap-2"
          >
            <div className="relative min-w-[12rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search reference, sender number, order…"
                className="input pl-9"
                aria-label="Search payments"
              />
            </div>
            <select
              name="status"
              defaultValue={status}
              className="input w-auto"
              aria-label="Filter by payment status"
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
              <option value="REFUNDED">Refunded</option>
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

        {payments.length === 0 ? (
          <EmptyState title="No payments match these filters" />
        ) : (
          <>
            <DataTable
              head={[
                "Order",
                "Method",
                "Amount",
                "Reference",
                "Sender",
                "Status",
                "Action",
              ]}
            >
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-3 py-3">
                    <Link
                      href={`/admin/orders/${payment.order.id}`}
                      className="font-medium text-fg hover:text-brand-fg"
                    >
                      {payment.order.number}
                    </Link>
                    <p className="text-[11px] text-fg-subtle">
                      {payment.order.shippingName}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-fg-muted">
                    {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                  </td>
                  <td className="px-3 py-3 font-semibold text-fg">
                    {money(payment.amount)}
                  </td>
                  <td className="px-3 py-3 text-fg-muted">
                    {payment.reference ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-fg-muted">
                    {payment.senderNumber ?? "—"}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge tone={statusTone(payment.status)}>
                      {payment.status}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-3">
                    {payment.status === "PENDING" ? (
                      <PaymentVerifyButton
                        paymentId={payment.id}
                        status={payment.status}
                      />
                    ) : (
                      <span className="text-[11px] text-fg-subtle">
                        {payment.verifiedBy ?? "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </DataTable>

            <Pagination
              page={page}
              totalPages={totalPages}
              basePath="/admin/payments"
              params={{
                q: query || undefined,
                status: status || undefined,
                method: method || undefined,
              }}
            />
          </>
        )}
      </Panel>

      <Panel title="Cash on delivery collection">
        {codOutstanding === 0 ? (
          <EmptyState
            title="Every cash order is collected"
            description="COD orders appear here until the cash is handed over."
          />
        ) : (
          <ul className="space-y-2">
            {(
              await prisma.order.findMany({
                where: { paymentMethod: "cod", paymentStatus: { not: "PAID" } },
                include: { items: true },
                orderBy: { createdAt: "desc" },
                take: 20,
              })
            ).map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-3 py-2"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-sm font-medium text-fg hover:text-brand-fg"
                  >
                    {order.number}
                  </Link>
                  <p className="text-[11px] text-fg-subtle">
                    {order.shippingName} · {order.city} ·{" "}
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-fg">
                    {money(order.total)}
                  </span>
                  <CollectCodButton
                    orderId={order.id}
                    paymentStatus={order.paymentStatus}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <p className="flex items-center gap-2 text-[11px] text-fg-subtle">
        <ShieldCheck className="h-3.5 w-3.5" />
        A manual transaction is never marked as paid without an explicit admin
        verification, and every decision is written to the audit log.
      </p>
    </div>
  );
}
