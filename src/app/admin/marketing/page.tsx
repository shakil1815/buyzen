import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";
import { formatDate, formatMoney } from "@/lib/format";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/admin/ui";
import {
  BannerForm,
  CouponForm,
  FlashSaleForm,
  ToggleButton,
} from "@/components/admin/marketing-forms";

export const metadata = { title: "Marketing" };

export default async function AdminMarketingPage() {
  await requirePermission("marketing.manage");

  const [banners, flashSales, coupons, carts, customers, currency] =
    await Promise.all([
      prisma.banner.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.flashSale.findMany({
        include: { products: { select: { id: true, name: true } } },
        orderBy: { startsAt: "desc" },
      }),
      prisma.coupon.findMany({
        include: { customer: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.cart.findMany({
        where: { items: { some: {} } },
        include: { items: { include: { product: { select: { name: true, price: true } } } } },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      prisma.user.findMany({
        where: { role: "CUSTOMER" },
        select: { id: true, name: true, email: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      getCurrency(),
    ]);

  const rate = usdToBdtRate();
  const money = (cents: number) => formatMoney(cents, currency, rate);
  const now = new Date();

  const abandonedValue = carts.reduce(
    (sum, cart) =>
      sum +
      cart.items.reduce(
        (inner, item) => inner + item.product.price * item.quantity,
        0,
      ),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing & promotions"
        description="Coupons, banners, flash sales and abandoned carts."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Promotional banners">
          <BannerForm />
          {banners.length === 0 ? (
            <EmptyState title="No banners yet" />
          ) : (
            <ul className="mt-5 space-y-2">
              {banners.map((banner) => (
                <li
                  key={banner.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">
                      {banner.title}
                    </p>
                    <p className="truncate text-[11px] text-fg-subtle">
                      {banner.position} · {banner.subtitle ?? "no subtitle"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge tone={banner.active ? "green" : "grey"}>
                      {banner.active ? "Live" : "Hidden"}
                    </StatusBadge>
                    <ToggleButton
                      action={toggleBanner}
                      id={banner.id}
                      label={banner.active ? "Hide" : "Show"}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Flash sales">
          <FlashSaleForm />
          {flashSales.length === 0 ? (
            <EmptyState title="No flash sales scheduled" />
          ) : (
            <ul className="mt-5 space-y-2">
              {flashSales.map((sale) => {
                const live = sale.active && sale.startsAt <= now && sale.endsAt >= now;
                return (
                  <li
                    key={sale.id}
                    className="rounded-lg border border-line px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-fg">{sale.name}</p>
                      <StatusBadge tone={live ? "green" : "grey"}>
                        {live ? "Live" : "Scheduled"}
                      </StatusBadge>
                    </div>
                    <p className="mt-0.5 text-[11px] text-fg-subtle">
                      {sale.discount}% off · {formatDate(sale.startsAt)} →{" "}
                      {formatDate(sale.endsAt)} ·{" "}
                      {sale.products.map((product) => product.name).join(", ") ||
                        "no products"}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Coupon codes"
        description="Percentage or fixed amount, with optional customer targeting."
      >
        <CouponForm customers={customers} />
        {coupons.length === 0 ? (
          <EmptyState title="No coupons yet" />
        ) : (
          <div className="mt-5">
            <DataTable
              head={[
                "Code",
                "Value",
                "Min. order",
                "Used",
                "Audience",
                "Expires",
                "Status",
              ]}
            >
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-fg">{coupon.code}</p>
                    {coupon.description ? (
                      <p className="text-[11px] text-fg-subtle">
                        {coupon.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-fg-muted">
                    {coupon.type === "PERCENT"
                      ? `${coupon.value}%`
                      : money(coupon.value)}
                  </td>
                  <td className="px-3 py-3 text-fg-muted">
                    {coupon.minSubtotal > 0 ? money(coupon.minSubtotal) : "—"}
                  </td>
                  <td className="px-3 py-3 text-fg-muted">{coupon.usedCount}</td>
                  <td className="px-3 py-3 text-fg-muted">
                    {coupon.customer
                      ? `${coupon.customer.name} (personal)`
                      : "Everyone"}
                  </td>
                  <td className="px-3 py-3 text-fg-muted">
                    {coupon.expiresAt ? formatDate(coupon.expiresAt) : "Never"}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge tone={coupon.active ? "green" : "grey"}>
                      {coupon.active ? "Active" : "Off"}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </DataTable>
          </div>
        )}
      </Panel>

      <Panel
        title="Abandoned carts"
        description="Guest carts that were never converted into an order."
      >
        {carts.length === 0 ? (
          <EmptyState title="No abandoned carts" />
        ) : (
          <ul className="space-y-2">
            {carts.map((cart) => {
              const value = cart.items.reduce(
                (sum, item) => sum + item.product.price * item.quantity,
                0,
              );
              return (
                <li
                  key={cart.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg">
                      {cart.items.length} item
                      {cart.items.length === 1 ? "" : "s"} left in the cart
                    </p>
                    <p className="text-[11px] text-fg-subtle">
                      Last activity {formatDate(cart.updatedAt)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-fg">
                    {money(value)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-[11px] text-fg-subtle">
          Total abandoned value: {money(abandonedValue)}. Issue a targeted coupon
          from the segments page to win these shoppers back.
        </p>
      </Panel>

      <Panel title="Loyalty & referrals">
        <p className="text-sm text-fg-muted">
          Loyalty points and referral rewards are modelled as store settings so
          they can be configured without a code change. Points are awarded on
          every paid order and referrals are tracked through coupon codes.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Loyalty points per ৳100", "1 point"],
            ["Referral reward", "৳100 credit"],
            ["Referral code prefix", "REF-"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-line p-3">
              <p className="text-xs font-semibold text-fg">{value}</p>
              <p className="text-[11px] text-fg-subtle">{label}</p>
            </div>
          ))}
        </div>
        <Link href="/admin/settings" className="btn btn-outline mt-4">
          Configure in settings
        </Link>
      </Panel>
    </div>
  );
}

async function toggleBanner(id: string) {
  "use server";
  const { toggleBannerAction } = await import("@/lib/actions/admin-growth");
  await toggleBannerAction(id);
}
