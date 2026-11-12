import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Package,
  ShoppingBag,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { requirePermission } from "@/lib/permissions";
import {
  RANGE_OPTIONS,
  getBestSellingProducts,
  getCategoryPerformance,
  getCustomerSeries,
  getOverview,
  getPaymentDistribution,
  getRevenueByDistrict,
  getSalesSeries,
  getTopCustomers,
  growth,
  resolveRange,
} from "@/lib/admin/analytics";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";
import { formatMoney } from "@/lib/format";
import {
  BarChart,
  CHART_COLORS,
  DonutChart,
  HorizontalBars,
  LineChart,
} from "@/components/admin/charts";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/admin/ui";

function Trend({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
        positive ? "text-success-fg" : "text-danger-fg"
      }`}
    >
      {positive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {Math.abs(value)}%
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  trend,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  hint?: string;
  trend?: number;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand-fg">
          <Icon className="h-4.5 w-4.5" />
        </span>
        {trend !== undefined ? <Trend value={trend} /> : null}
      </div>
      <p className="mt-3 text-xl font-black tracking-tight text-fg-strong">
        {value}
      </p>
      <p className="text-[11px] font-medium text-fg-muted">{label}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-fg-subtle">{hint}</p> : null}
    </div>
  );
}

export default async function AdminDashboard(props: PageProps<"/admin">) {
  await requirePermission("dashboard.view");
  const searchParams = (await props.searchParams) as Record<
    string,
    string | string[] | undefined
  >;
  const rangeKey = Array.isArray(searchParams.range)
    ? searchParams.range[0]
    : (searchParams.range ?? "30d");

  const { range, granularity, label } = resolveRange(rangeKey);
  const currency = await getCurrency();
  const rate = usdToBdtRate();
  const money = (cents: number) => formatMoney(cents, currency, rate);

  const [
    overview,
    salesSeries,
    customerSeries,
    bestSellers,
    categories,
    paymentMix,
    districts,
    topCustomers,
  ] = await Promise.all([
    getOverview(range),
    getSalesSeries(range, granularity),
    getCustomerSeries(range, granularity),
    getBestSellingProducts(6),
    getCategoryPerformance(),
    getPaymentDistribution(range),
    getRevenueByDistrict(8),
    getTopCustomers(6),
  ]);

  const statusSlices = Object.entries(overview.orderStatus).map(
    ([label, value], index) => ({
      label: label.replace(/_/g, " ").toLowerCase(),
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }),
  );

  const paymentSlices = paymentMix.map((slice, index) => ({
    label: slice.label,
    value: slice.value,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Live business performance · ${label}`}
        actions={
          <Link href="/admin/reports" className="btn btn-outline">
            Export reports
          </Link>
        }
      />

      {/* Range filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg-muted">
          <CalendarDays className="h-3.5 w-3.5" /> Period
        </span>
        {RANGE_OPTIONS.map((option) => (
          <Link
            key={option.key}
            href={`/admin?range=${option.key}`}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              rangeKey === option.key
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-line bg-surface text-fg-muted hover:bg-surface-2"
            }`}
          >
            {option.label}
          </Link>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard
          icon={Banknote}
          label="Total revenue"
          value={money(overview.revenue)}
          trend={growth(overview.revenue, overview.previousRevenue)}
        />
        <StatCard
          icon={ShoppingBag}
          label="Total sales (units)"
          value={String(overview.sales)}
          trend={growth(overview.sales, overview.previousSales)}
        />
        <StatCard
          icon={Package}
          label="Total orders"
          value={String(overview.orders)}
          trend={growth(overview.orders, overview.previousOrders)}
        />
        <StatCard
          icon={Users}
          label="Total customers"
          value={String(overview.customers)}
          hint={`${overview.activeCustomers} active in period`}
        />
        <StatCard
          icon={UserPlus}
          label="New customers"
          value={String(overview.newCustomers)}
          hint="registered in period"
        />
        <StatCard
          icon={TrendingUp}
          label="Average order value"
          value={money(overview.averageOrderValue)}
        />
      </div>

      {/* Status + payments */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Order status distribution">
          {statusSlices.length ? (
            <DonutChart
              slices={statusSlices}
              currency={currency}
              rate={rate}
            />
          ) : (
            <EmptyState title="No orders in this period" />
          )}
        </Panel>

        <Panel title="Payment methods">
          {paymentSlices.length ? (
            <DonutChart
              slices={paymentSlices}
              currency={currency}
              rate={rate}
            />
          ) : (
            <EmptyState title="No payments in this period" />
          )}
        </Panel>

        <Panel title="Attention required">
          <ul className="space-y-2.5 text-sm">
            {[
              {
                label: "Pending payments to verify",
                value: overview.pendingPayments,
                href: "/admin/payments?status=PENDING",
                tone: "amber" as const,
              },
              {
                label: "Successful payments",
                value: overview.successfulPayments,
                href: "/admin/payments?status=VERIFIED",
                tone: "green" as const,
              },
              {
                label: "Refund requests",
                value: overview.refundRequests,
                href: "/admin/refunds",
                tone: "red" as const,
              },
              {
                label: "Low stock products",
                value: overview.lowStockProducts,
                href: "/admin/inventory",
                tone: "amber" as const,
              },
              {
                label: "Out of stock products",
                value: overview.outOfStockProducts,
                href: "/admin/inventory?filter=out",
                tone: "red" as const,
              },
              {
                label: "Cancelled orders",
                value: overview.orderStatus.CANCELLED ?? 0,
                href: "/admin/orders?status=CANCELLED",
                tone: "grey" as const,
              },
            ].map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 transition hover:bg-surface-2"
                >
                  <span className="text-fg-muted">{item.label}</span>
                  <StatusBadge tone={item.tone}>{item.value}</StatusBadge>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Trends */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Sales trend"
          description={`Revenue and order volume · ${label}`}
        >
          <BarChart
            points={salesSeries.map((point) => ({
              label: point.label,
              value: point.revenue,
              hint: `${point.orders} orders`,
            }))}
            currency={currency}
            rate={rate}
          />
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
            <div>
              <p className="text-lg font-black text-fg-strong">
                {money(overview.revenue)}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-fg-subtle">
                Revenue
              </p>
            </div>
            <div>
              <p className="text-lg font-black text-fg-strong">
                {overview.orders}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-fg-subtle">
                Orders
              </p>
            </div>
            <div>
              <p className="text-lg font-black text-fg-strong">
                {overview.customers}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-fg-subtle">
                Customers
              </p>
            </div>
          </div>
        </Panel>

        <Panel
          title="Customer registration growth"
          description="New accounts created per bucket"
        >
          <LineChart
            points={customerSeries.map((point) => ({
              label: point.label,
              value: point.orders,
            }))}
            currency={currency}
            rate={rate}
          />
        </Panel>
      </div>

      {/* Breakdowns */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Best selling products"
          actions={
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-brand-fg"
            >
              Manage
            </Link>
          }
        >
          {bestSellers.length ? (
            <HorizontalBars
              currency={currency}
              rate={rate}
              points={bestSellers.map((product) => ({
                label: product.name,
                value: product.revenue,
                hint: `${product.quantity} sold · ${money(product.revenue)}`,
              }))}
            />
          ) : (
            <EmptyState title="No sales yet" />
          )}
        </Panel>

        <Panel title="Most popular categories">
          {categories.length ? (
            <HorizontalBars
              currency={currency}
              rate={rate}
              points={categories.map((category) => ({
                label: category.label,
                value: category.value,
                hint: `${category.value} units`,
              }))}
            />
          ) : (
            <EmptyState title="No category data yet" />
          )}
        </Panel>

        <Panel
          title="Revenue by district"
          actions={
            <Link
              href="/admin/locations"
              className="text-xs font-semibold text-brand-fg"
            >
              Location analytics
            </Link>
          }
        >
          {districts.length ? (
            <HorizontalBars
              currency={currency}
              rate={rate}
              points={districts.map((district) => ({
                label: district.label,
                value: district.value,
                hint: `${district.orders} orders`,
              }))}
            />
          ) : (
            <EmptyState title="No delivery data yet" />
          )}
        </Panel>

        <Panel
          title="Top customers by purchase value"
          actions={
            <Link
              href="/admin/customers"
              className="text-xs font-semibold text-brand-fg"
            >
              All customers
            </Link>
          }
        >
          {topCustomers.length ? (
            <ul className="space-y-2.5">
              {topCustomers.map((customer, index) => (
                <li
                  key={`${customer.email}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-line px-3 py-2"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-surface-3 text-xs font-bold text-fg-muted">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">
                      {customer.name}
                    </p>
                    <p className="truncate text-[11px] text-fg-subtle">
                      {customer.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-fg">
                      {money(customer.revenue)}
                    </p>
                    <p className="text-[10px] text-fg-subtle">
                      {customer.orders} orders
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No customer orders yet" />
          )}
        </Panel>
      </div>

      <p className="flex items-center gap-2 text-[11px] text-fg-subtle">
        <AlertTriangle className="h-3.5 w-3.5" />
        Every figure on this page is calculated from live database records for
        the selected period.
      </p>
    </div>
  );
}
