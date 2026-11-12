import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";
import { formatDate, formatMoney } from "@/lib/format";
import { statusTone } from "@/lib/orders";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/admin/ui";
import { RefundActions } from "@/components/admin/refund-actions";

export const metadata = { title: "Returns & refunds" };

export default async function AdminRefundsPage() {
  await requirePermission("payments.view");

  const [refunds, currency] = await Promise.all([
    prisma.refundRequest.findMany({
      include: {
        order: {
          select: {
            id: true,
            number: true,
            shippingName: true,
            total: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    getCurrency(),
  ]);

  const rate = usdToBdtRate();
  const money = (cents: number) => formatMoney(cents, currency, rate);
  const pending = refunds.filter((refund) => refund.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Returns & refunds"
        description={`${pending} request${pending === 1 ? "" : "s"} waiting for a decision`}
      />

      <Panel>
        {refunds.length === 0 ? (
          <EmptyState
            title="No refund requests"
            description="Requests raised from an order appear here for review."
          />
        ) : (
          <DataTable
            head={[
              "Order",
              "Customer",
              "Amount",
              "Reason",
              "Requested",
              "Status",
              "Decision",
            ]}
          >
            {refunds.map((refund) => (
              <tr key={refund.id}>
                <td className="px-3 py-3">
                  <Link
                    href={`/admin/orders/${refund.order.id}`}
                    className="font-medium text-fg hover:text-brand-fg"
                  >
                    {refund.order.number}
                  </Link>
                </td>
                <td className="px-3 py-3 text-fg-muted">
                  {refund.order.shippingName}
                  <p className="text-[11px] text-fg-subtle">
                    {refund.order.email}
                  </p>
                </td>
                <td className="px-3 py-3 font-semibold text-fg">
                  {money(refund.amount)}
                </td>
                <td className="px-3 py-3 text-fg-muted">{refund.reason}</td>
                <td className="px-3 py-3 text-fg-muted">
                  {formatDate(refund.createdAt)}
                </td>
                <td className="px-3 py-3">
                  <StatusBadge tone={statusTone(refund.status)}>
                    {refund.status}
                  </StatusBadge>
                </td>
                <td className="px-3 py-3">
                  {refund.status === "PENDING" ? (
                    <RefundActions refundId={refund.id} />
                  ) : (
                    <span className="text-[11px] text-fg-subtle">
                      {refund.resolvedBy ?? "—"}
                      {refund.resolution ? ` · ${refund.resolution}` : ""}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
