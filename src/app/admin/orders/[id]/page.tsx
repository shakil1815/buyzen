import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer, Truck } from "lucide-react";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";
import { formatDate, formatMoney } from "@/lib/format";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  statusTone,
} from "@/lib/orders";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/admin/ui";
import {
  CourierForm,
  OrderNoteForm,
  OrderStatusManager,
} from "@/components/admin/order-actions";

export const metadata = { title: "Order detail" };

export default async function AdminOrderDetailPage(
  props: PageProps<"/admin/orders/[id]">,
) {
  await requirePermission("orders.view");
  const { id } = await props.params;

  const [order, currency] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
        events: { orderBy: { createdAt: "desc" } },
        history: { orderBy: { createdAt: "desc" } },
        payments: { orderBy: { createdAt: "desc" } },
        refunds: { orderBy: { createdAt: "desc" } },
      },
    }),
    getCurrency(),
  ]);

  if (!order) notFound();

  const rate = usdToBdtRate();
  const money = (cents: number) => formatMoney(cents, currency, rate);
  const statusLabel =
    ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ??
    order.status;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm font-semibold text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <PageHeader
        title={order.number}
        description={`Placed ${formatDate(order.createdAt)} · ${order.invoiceNumber ?? "no invoice number"}`}
        actions={
          <>
            <Link
              href={`/admin/orders/${order.id}/invoice`}
              className="btn btn-outline"
            >
              <Printer className="h-4 w-4" /> Invoice
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={statusTone(order.status)}>{statusLabel}</StatusBadge>
        <StatusBadge tone={statusTone(order.paymentStatus)}>
          {order.paymentStatus}
        </StatusBadge>
        <span className="badge bg-surface-3 text-fg-muted">
          {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
        </span>
        {order.couponCode ? (
          <span className="badge bg-brand-soft text-brand-fg">
            {order.couponCode}
          </span>
        ) : null}
        {order.trackingNumber ? (
          <span className="badge bg-info-soft text-info-fg">
            {order.trackingNumber}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Order actions">
          <OrderStatusManager orderId={order.id} status={order.status} />
          <p className="mt-3 text-[11px] text-fg-subtle">
            Only valid forward transitions are offered, and every change is
            recorded in the audit history.
          </p>
        </Panel>

        <Panel title="Customer">
          <dl className="space-y-2 text-sm">
            {[
              ["Name", order.shippingName],
              ["Email", order.email],
              ["Phone", order.phone ?? "—"],
              [
                "Account",
                order.user
                  ? `${order.user.name} (${order.user.email})`
                  : "Guest checkout",
              ],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-fg-muted">{label}</dt>
                <dd className="text-right font-medium text-fg">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Shipping address">
          <p className="text-sm leading-relaxed text-fg-muted">
            {order.address1}
            {order.address2 ? `, ${order.address2}` : ""}
            <br />
            {order.city} {order.state} {order.postalCode}
            <br />
            {order.district ? `${order.district}, ` : ""}
            {order.division ? `${order.division}, ` : ""}
            {order.country}
          </p>
          {order.courierName ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-fg-muted">
              <Truck className="h-3.5 w-3.5" />
              {order.courierName} · {order.trackingNumber}
            </p>
          ) : null}
        </Panel>
      </div>

      <Panel title="Items">
        <DataTable head={["Product", "Qty", "Price", "Total"]}>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td className="px-3 py-3">
                <Link
                  href={`/products/${item.slug}`}
                  className="font-medium text-fg hover:text-brand-fg"
                >
                  {item.name}
                </Link>
                {item.variant ? (
                  <p className="text-[11px] text-fg-subtle">{item.variant}</p>
                ) : null}
              </td>
              <td className="px-3 py-3 text-fg-muted">{item.quantity}</td>
              <td className="px-3 py-3 text-fg-muted">{money(item.price)}</td>
              <td className="px-3 py-3 font-semibold text-fg">
                {money(item.price * item.quantity)}
              </td>
            </tr>
          ))}
        </DataTable>

        <dl className="mt-4 ml-auto max-w-xs space-y-1.5 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-fg-muted">Subtotal</dt>
            <dd>{money(order.subtotal)}</dd>
          </div>
          {order.discount > 0 ? (
            <div className="flex justify-between text-success-fg">
              <dt>Discount {order.couponCode ? `(${order.couponCode})` : ""}</dt>
              <dd>−{money(order.discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-fg-muted">Shipping</dt>
            <dd>{order.shipping === 0 ? "Free" : money(order.shipping)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-fg-muted">Tax</dt>
            <dd>{money(order.tax)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base">
            <dt className="font-bold text-fg">Total</dt>
            <dd className="font-black text-fg-strong">{money(order.total)}</dd>
          </div>
          {order.refundedAmount > 0 ? (
            <div className="flex justify-between text-danger-fg">
              <dt>Refunded</dt>
              <dd>−{money(order.refundedAmount)}</dd>
            </div>
          ) : null}
        </dl>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Courier & tracking">
          <CourierForm
            orderId={order.id}
            courierName={order.courierName}
            courierPhone={order.courierPhone}
            trackingNumber={order.trackingNumber}
          />
        </Panel>

        <Panel title="Internal notes">
          <OrderNoteForm orderId={order.id} />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Order timeline">
          {order.events.length === 0 ? (
            <EmptyState title="No timeline events yet" />
          ) : (
            <ol className="space-y-3">
              {order.events.map((event) => (
                <li key={event.id} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-fg">{event.message}</p>
                    <p className="text-[11px] text-fg-subtle">
                      {event.actor} · {formatDate(event.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Payment history & refunds">
          {order.payments.length === 0 && order.refunds.length === 0 ? (
            <EmptyState title="No payment records" />
          ) : (
            <div className="space-y-4">
              {order.payments.length > 0 ? (
                <div>
                  <p className="text-xs font-bold text-fg">Payments</p>
                  <ul className="mt-2 space-y-2">
                    {order.payments.map((payment) => (
                      <li
                        key={payment.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-fg">
                            {PAYMENT_METHOD_LABELS[payment.method] ??
                              payment.method}{" "}
                            · {money(payment.amount)}
                          </p>
                          <p className="truncate text-[11px] text-fg-subtle">
                            {payment.reference ?? "no reference"}
                            {payment.senderNumber
                              ? ` · ${payment.senderNumber}`
                              : ""}
                          </p>
                        </div>
                        <StatusBadge tone={statusTone(payment.status)}>
                          {payment.status}
                        </StatusBadge>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {order.refunds.length > 0 ? (
                <div>
                  <p className="text-xs font-bold text-fg">Refund requests</p>
                  <ul className="mt-2 space-y-2">
                    {order.refunds.map((refund) => (
                      <li
                        key={refund.id}
                        className="rounded-lg border border-line px-3 py-2 text-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-fg">
                            {money(refund.amount)}
                          </p>
                          <StatusBadge tone={statusTone(refund.status)}>
                            {refund.status}
                          </StatusBadge>
                        </div>
                        <p className="text-[11px] text-fg-subtle">
                          {refund.reason} · {formatDate(refund.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </Panel>
      </div>

      {order.history.length > 0 ? (
        <Panel title="Status history">
          <DataTable head={["From", "To", "Actor", "Reason", "When"]}>
            {order.history.map((entry) => (
              <tr key={entry.id}>
                <td className="px-3 py-2.5 text-fg-muted">{entry.from}</td>
                <td className="px-3 py-2.5 font-medium text-fg">{entry.to}</td>
                <td className="px-3 py-2.5 text-fg-muted">{entry.actor}</td>
                <td className="px-3 py-2.5 text-fg-muted">
                  {entry.reason ?? "—"}
                </td>
                <td className="px-3 py-2.5 text-fg-muted">
                  {formatDate(entry.createdAt)}
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      ) : null}
    </div>
  );
}
