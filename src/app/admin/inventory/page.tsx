import Link from "next/link";
import { Download, Package, Search, TriangleAlert } from "lucide-react";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";
import { formatMoney } from "@/lib/format";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  Toolbar,
} from "@/components/admin/ui";
import { StockAdjustForm } from "@/components/admin/stock-controls";

export const metadata = { title: "Inventory" };

export default async function AdminInventoryPage(
  props: PageProps<"/admin/inventory">,
) {
  await requirePermission("inventory.manage");
  const searchParams = (await props.searchParams) as Record<
    string,
    string | string[] | undefined
  >;
  const pick = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  };
  const filter = pick("filter");
  const query = pick("q");

  const where = {
    ...(filter === "out" ? { stock: { lte: 0 } } : {}),
    ...(filter === "low" ? { stock: { gt: 0, lte: 10 } } : {}),
    ...(query
      ? { OR: [{ name: { contains: query } }, { sku: { contains: query } }] }
      : {}),
  };

  const [products, totals, sold, currency] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: { stock: "asc" },
      take: 100,
    }),
    prisma.product.aggregate({ _sum: { stock: true, cost: true } }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    getCurrency(),
  ]);

  const rate = usdToBdtRate();
  const money = (cents: number) => formatMoney(cents, currency, rate);
  const [outOfStock, lowStock] = await Promise.all([
    prisma.product.count({ where: { stock: { lte: 0 } } }),
    prisma.product.count({ where: { stock: { gt: 0, lte: 10 } } }),
  ]);
  const productCount = await prisma.product.count();
  const avgCostRows = await prisma.product.aggregate({
    _sum: { cost: true },
    _count: { cost: true },
  });
  const averageCost = avgCostRows._count.cost
    ? (avgCostRows._sum.cost ?? 0) / avgCostRows._count.cost
    : 0;

  const topProducts = await prisma.product.findMany({
    where: { id: { in: sold.map((row) => row.productId ?? "") } },
    select: { id: true, name: true },
  });
  const nameOf = new Map(topProducts.map((product) => [product.id, product.name]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Stock levels, thresholds and inventory valuation."
        actions={
          <Link href="/api/admin/export/inventory" className="btn btn-outline">
            <Download className="h-4 w-4" /> Export CSV
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total products", String(productCount)],
          ["Units in stock", String(totals._sum.stock ?? 0)],
          ["Low stock", String(lowStock)],
          ["Out of stock", String(outOfStock)],
        ].map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-2xl font-black tracking-tight text-fg-strong">
              {value}
            </p>
            <p className="text-[11px] font-medium text-fg-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Inventory valuation">
          <p className="text-3xl font-black tracking-tight text-fg-strong">
            {money(
              Math.round((totals._sum.stock ?? 0) * averageCost),
            )}
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            Units in stock valued at the average unit cost of{" "}
            {money(Math.round(averageCost))}.
          </p>
          <p className="mt-3 text-[11px] text-fg-subtle">
            Retail value of the same units:{" "}
            {money(
              (
                await prisma.product.aggregate({ _sum: { price: true } })
              )._sum.price ?? 0,
            )}{" "}
            across the catalogue.
          </p>
        </Panel>

        <Panel title="Best selling by units">
          {sold.length === 0 ? (
            <EmptyState title="No sales yet" />
          ) : (
            <ul className="space-y-2">
              {sold.map((row, index) => (
                <li
                  key={row.productId ?? index}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm text-fg">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-surface-3 text-[11px] font-bold text-fg-muted">
                      {index + 1}
                    </span>
                    {nameOf.get(row.productId ?? "") ?? "Unknown"}
                  </span>
                  <span className="text-sm font-semibold text-fg">
                    {row._sum.quantity} sold
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Stock levels">
        <Toolbar>
          <form
            method="get"
            action="/admin/inventory"
            className="flex flex-1 flex-wrap items-center gap-2"
          >
            <div className="relative min-w-[12rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Search product or SKU…"
                className="input pl-9"
                aria-label="Search inventory"
              />
            </div>
            <select
              name="filter"
              defaultValue={filter}
              className="input w-auto"
              aria-label="Filter inventory"
            >
              <option value="">All products</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
            <button type="submit" className="btn btn-dark">
              Apply
            </button>
          </form>
        </Toolbar>

        {products.length === 0 ? (
          <EmptyState title="No products match" />
        ) : (
          <DataTable
            head={[
              "Product",
              "Category",
              "Stock",
              "Threshold",
              "Value",
              "Adjust",
            ]}
          >
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-3 py-3">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="font-medium text-fg hover:text-brand-fg"
                  >
                    {product.name}
                  </Link>
                  <p className="text-[11px] text-fg-subtle">{product.sku}</p>
                </td>
                <td className="px-3 py-3 text-fg-muted">
                  {product.category.name}
                </td>
                <td className="px-3 py-3">
                  <StatusBadge
                    tone={
                      product.stock <= 0
                        ? "red"
                        : product.stock <= product.lowStockThreshold
                          ? "amber"
                          : "green"
                    }
                  >
                    {product.stock <= 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <TriangleAlert className="h-3 w-3" /> Out of stock
                      </span>
                    ) : (
                      product.stock
                    )}
                  </StatusBadge>
                </td>
                <td className="px-3 py-3 text-fg-muted">
                  {product.lowStockThreshold}
                </td>
                <td className="px-3 py-3 text-fg-muted">
                  {money(product.stock * product.price)}
                </td>
                <td className="px-3 py-3">
                  <StockAdjustForm
                    productId={product.id}
                    threshold={product.lowStockThreshold}
                  />
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <p className="flex items-center gap-2 text-[11px] text-fg-subtle">
        <Package className="h-3.5 w-3.5" />
        Stock changes are written to the audit log with the reason you provide.
      </p>
    </div>
  );
}
