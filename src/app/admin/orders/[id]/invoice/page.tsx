import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";
import { formatDate, formatMoney } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/orders";

export const metadata = { title: "Invoice" };

export default async function InvoicePage(
  props: PageProps<"/admin/orders/[id]/invoice">,
) {
  await requirePermission("orders.invoice");
  const { id } = await props.params;

  const [order, currency] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: { items: true },
    }),
    getCurrency(),
  ]);
  if (!order) notFound();

  const rate = usdToBdtRate();
  const money = (cents: number) => formatMoney(cents, currency, rate);
  const invoiceNumber =
    order.invoiceNumber ?? `INV-${order.number.replace("BZ-", "")}`;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={`/admin/orders/${order.id}`} className="btn btn-outline">
          Back to order
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn btn-primary"
        >
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </button>
      </div>

      <div className="card p-8 print:border-0 print:shadow-none">
        <div className="flex items-start justify-between gap-6 border-b border-line pb-6">
          <div>
            <p className="text-xl font-black tracking-tight text-fg-strong">
              BuyZen
            </p>
            <p className="mt-1 text-xs text-fg-muted">
              42 Gulshan Avenue, Dhaka 1212, Bangladesh
              <br />
              support@buyzen.com · +880 1710-000000
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-fg-subtle">
              Invoice
            </p>
            <p className="text-lg font-black text-fg-strong">
              {invoiceNumber}
            </p>
            <p className="text-xs text-fg-muted">
              {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-fg-subtle">
              Billed to
            </p>
            <p className="mt-1 text-sm font-semibold text-fg">
              {order.shippingName}
            </p>
            <p className="text-xs text-fg-muted">
              {order.address1}
              {order.address2 ? `, ${order.address2}` : ""}
              <br />
              {order.city} {order.postalCode}
              <br />
              {order.country}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-fg-subtle">
              Payment
            </p>
            <p className="mt-1 text-sm text-fg">
              {PAYMENT_METHOD_LABELS[order.paymentMethod] ??
                order.paymentMethod}
            </p>
            <p className="text-xs text-fg-muted">
              Reference: {order.paymentRef ?? "—"}
              <br />
              Status: {order.paymentStatus}
            </p>
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-[11px] uppercase tracking-wide text-fg-subtle">
            <tr>
              <th className="py-2 font-semibold">Item</th>
              <th className="py-2 font-semibold">Qty</th>
              <th className="py-2 font-semibold">Price</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2.5 text-fg">{item.name}</td>
                <td className="py-2.5 text-fg-muted">{item.quantity}</td>
                <td className="py-2.5 text-fg-muted">{money(item.price)}</td>
                <td className="py-2.5 text-right font-medium text-fg">
                  {money(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 ml-auto max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-fg-muted">Subtotal</dt>
            <dd>{money(order.subtotal)}</dd>
          </div>
          {order.discount > 0 ? (
            <div className="flex justify-between text-success-fg">
              <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
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
            <dt className="font-bold text-fg">Total due</dt>
            <dd className="font-black text-fg-strong">{money(order.total)}</dd>
          </div>
        </div>

        <p className="mt-8 border-t border-line pt-4 text-[11px] text-fg-subtle">
          Thank you for your order. This is a computer generated invoice from
          the BuyZen demo store.
        </p>
      </div>
    </div>
  );
}
