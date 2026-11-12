import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  MapPinOff,
  ShieldCheck,
  Star,
} from "lucide-react";
import { requirePermission } from "@/lib/permissions";
import { getCustomerProfile } from "@/lib/admin/customers";
import { SEGMENT_LABELS } from "@/lib/admin/customers";
import { prisma } from "@/lib/prisma";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";
import { formatDate, formatMoney } from "@/lib/format";
import {
  CustomerEditForm,
  CustomerStatusButton,
} from "@/components/admin/customer-forms";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/admin/ui";
import { WithdrawLocationButton } from "@/components/admin/location-consent-button";

export const metadata = { title: "Customer profile" };

export default async function CustomerProfilePage(
  props: PageProps<"/admin/customers/[id]">,
) {
  await requirePermission("customers.view");
  const { id } = await props.params;

  const [customer, currency] = await Promise.all([
    getCustomerProfile(id),
    getCurrency(),
  ]);
  if (!customer) notFound();

  const rate = usdToBdtRate();
  const money = (cents: number) => formatMoney(cents, currency, rate);

  const payments = await prisma.payment.findMany({
    where: { order: { userId: id } },
    include: { order: { select: { number: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1 text-sm font-semibold text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Back to customers
      </Link>

      <PageHeader
        title={customer.name}
        description={`Customer ${customer.id}`}
        actions={
          <>
            <CustomerStatusButton
              customerId={customer.id}
              status={customer.status}
            />
            {customer.locationConsent ? (
              <WithdrawLocationButton customerId={customer.id} />
            ) : null}
            <Link
              href={`/api/admin/export/customer/${customer.id}`}
              className="btn btn-outline"
            >
              Export
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={customer.status === "ACTIVE" ? "green" : "red"}>
          {customer.status}
        </StatusBadge>
        {customer.segments.map((segment) => (
          <span key={segment} className="badge bg-surface-3 text-fg-muted">
            {SEGMENT_LABELS[segment]}
          </span>
        ))}
        {customer.blockReason ? (
          <span className="badge bg-danger-soft text-danger-fg">
            Blocked: {customer.blockReason}
          </span>
        ) : null}
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total orders", String(customer.stats.orders)],
          ["Total spending", money(customer.stats.spent)],
          ["Average order value", money(customer.stats.averageOrderValue)],
          [
            "Last order",
            customer.stats.lastOrder
              ? formatDate(customer.stats.lastOrder)
              : "Never",
          ],
        ].map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xl font-black tracking-tight text-fg-strong">
              {value}
            </p>
            <p className="text-[11px] font-medium text-fg-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Personal + contact */}
        <Panel title="Personal & contact information">
          <dl className="space-y-2.5 text-sm">
            {[
              ["Full name", customer.name],
              ["Email", customer.email],
              ["Phone", customer.phone ?? "Not provided"],
              ["Registered", formatDate(customer.createdAt)],
              ["Last active", customer.lastActiveAt ? formatDate(customer.lastActiveAt) : "—"],
              ["Country", customer.country],
              [
                "City / District",
                [customer.city, customer.district].filter(Boolean).join(", ") || "—",
              ],
              ["Division", customer.division ?? "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-fg-muted">{label}</dt>
                <dd className="text-right font-medium text-fg">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        {/* Location consent */}
        <Panel title="Location & consent">
          {customer.locationConsent ? (
            <div className="space-y-3 text-sm">
              <p className="flex items-start gap-2 rounded-xl bg-success-soft px-3 py-2.5 text-xs font-medium text-success-fg">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                The customer granted location consent. Only the approximate
                district-level position below is shown.
              </p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-fg-muted">Division</dt>
                  <dd className="font-medium text-fg">
                    {customer.division ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-fg-muted">District</dt>
                  <dd className="font-medium text-fg">
                    {customer.district ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-fg-muted">Consent updated</dt>
                  <dd className="font-medium text-fg">
                    {customer.locationUpdatedAt
                      ? formatDate(customer.locationUpdatedAt)
                      : "—"}
                  </dd>
                </div>
              </dl>
              <p className="flex items-start gap-2 text-[11px] text-fg-subtle">
                <MapPinOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Precise coordinates are never displayed in the console and no
                continuous tracking is performed.
              </p>
            </div>
          ) : (
            <EmptyState
              title="No location consent"
              description="This customer has not shared a location, so nothing is stored or displayed."
            />
          )}
        </Panel>

        {/* Wishlist + coupons */}
        <Panel title="Wishlist & saved offers">
          {customer.wishlist.length === 0 ? (
            <EmptyState title="Wishlist is empty" />
          ) : (
            <ul className="space-y-2">
              {customer.wishlist.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-line px-3 py-2"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-3 text-fg-subtle">
                    <Star className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">
                      {item.product.name}
                    </p>
                    <p className="text-[11px] text-fg-subtle">
                      {money(item.product.price)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {customer.coupons.length > 0 ? (
            <div className="mt-4 border-t border-line pt-4">
              <p className="text-xs font-semibold text-fg">Personal coupons</p>
              <ul className="mt-2 space-y-1">
                {customer.coupons.map((coupon) => (
                  <li key={coupon.id} className="text-xs text-fg-muted">
                    <strong className="text-fg">{coupon.code}</strong> —{" "}
                    {coupon.description ?? "Customer specific offer"}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Panel>
      </div>

      {/* Edit form */}
      <Panel title="Edit permitted information">
        <p className="mb-4 text-xs text-fg-muted">
          Only operational details can be edited here. Authentication data is
          never editable from the admin console.
        </p>
        <CustomerEditForm
          customer={{
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            city: customer.city,
            district: customer.district,
            division: customer.division,
            postalCode: customer.postalCode,
            addressLine: customer.addressLine,
          }}
        />
      </Panel>

      {/* Order history */}
      <Panel title="Order history">
        {customer.orders.length === 0 ? (
          <EmptyState title="This customer has not ordered yet" />
        ) : (
          <DataTable
            head={["Order", "Date", "Items", "Total", "Payment", "Status"]}
          >
            {customer.orders.map((order) => (
              <tr key={order.id}>
                <td className="px-3 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium text-fg hover:text-brand-fg"
                  >
                    {order.number}
                  </Link>
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
                <td className="px-3 py-3 text-fg-muted">
                  {order.paymentMethod.toUpperCase()} ·{" "}
                  {order.paymentStatus}
                </td>
                <td className="px-3 py-3">
                  <StatusBadge
                    tone={
                      order.status === "DELIVERED"
                        ? "green"
                        : order.status === "CANCELLED"
                          ? "red"
                          : "blue"
                    }
                  >
                    {order.status.replace(/_/g, " ")}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Saved addresses */}
        <Panel title="Saved delivery addresses">
          {customer.addresses.length === 0 ? (
            <EmptyState title="No saved addresses" />
          ) : (
            <ul className="space-y-3">
              {customer.addresses.map((address) => (
                <li key={address.id} className="rounded-xl border border-line p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-fg">
                      {address.label}
                    </p>
                    {address.isDefault ? (
                      <StatusBadge tone="blue">Default</StatusBadge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-fg-muted">
                    {address.name} · {address.phone ?? "no phone"}
                  </p>
                  <p className="text-xs text-fg-muted">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""},{" "}
                    {address.city} {address.postalCode}, {address.district},{" "}
                    {address.country}
                  </p>
                  <p className="mt-1 text-[10px] text-fg-subtle">
                    Location consent:{" "}
                    {address.locationConsent ? "granted" : "not granted"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Payment history */}
        <Panel title="Payment history">
          {payments.length === 0 ? (
            <EmptyState title="No payments recorded" />
          ) : (
            <ul className="space-y-2">
              {payments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">
                      {payment.method.toUpperCase()} · {money(payment.amount)}
                    </p>
                    <p className="truncate text-[11px] text-fg-subtle">
                      Order {payment.order.number}
                      {payment.reference ? ` · ref ${payment.reference}` : ""}
                    </p>
                  </div>
                  <StatusBadge
                    tone={
                      payment.status === "VERIFIED"
                        ? "green"
                        : payment.status === "REJECTED"
                          ? "red"
                          : "amber"
                    }
                  >
                    {payment.status}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Activity */}
      <Panel title="Account activity">
        {customer.activities.length === 0 ? (
          <EmptyState title="No recorded activity" />
        ) : (
          <ul className="space-y-2">
            {customer.activities.map((activity) => (
              <li key={activity.id} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-fg">
                    {activity.type.replace(/_/g, " ")}
                  </p>
                  <p className="text-[11px] text-fg-subtle">
                    {formatDate(activity.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <p className="flex items-center gap-2 text-[11px] text-fg-subtle">
        <Ban className="h-3.5 w-3.5" />
        Admins can never view or export password hashes, tokens or other
        authentication secrets.
      </p>
    </div>
  );
}
