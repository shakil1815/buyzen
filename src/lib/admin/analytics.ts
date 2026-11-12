import { prisma } from "@/lib/prisma";

export type DateRange = { from: Date; to: Date };

export const RANGE_OPTIONS = [
  { key: "7d", label: "Last 7 days", days: 7, granularity: "day" },
  { key: "30d", label: "Last 30 days", days: 30, granularity: "day" },
  { key: "90d", label: "Last 90 days", days: 90, granularity: "week" },
  { key: "12m", label: "Last 12 months", days: 365, granularity: "month" },
  { key: "all", label: "All time", days: 3650, granularity: "month" },
] as const;

export type RangeKey = (typeof RANGE_OPTIONS)[number]["key"];

export function resolveRange(key?: string | null): {
  range: DateRange;
  granularity: "day" | "week" | "month";
  label: string;
} {
  const option =
    RANGE_OPTIONS.find((item) => item.key === key) ?? RANGE_OPTIONS[1];
  const to = new Date();
  const from = new Date(to.getTime() - option.days * 24 * 60 * 60 * 1000);
  from.setHours(0, 0, 0, 0);
  return { range: { from, to }, granularity: option.granularity, label: option.label };
}

function startOfBucket(date: Date, granularity: "day" | "week" | "month") {
  const value = new Date(date);
  if (granularity === "week") {
    const day = value.getDay();
    value.setDate(value.getDate() - (day === 0 ? 6 : day - 1));
    value.setHours(0, 0, 0, 0);
    return value;
  }
  if (granularity === "month") {
    value.setDate(1);
    value.setHours(0, 0, 0, 0);
    return value;
  }
  value.setHours(0, 0, 0, 0);
  return value;
}

export function bucketKey(date: Date, granularity: "day" | "week" | "month") {
  const bucket = startOfBucket(date, granularity);
  if (granularity === "month") {
    return `${bucket.getFullYear()}-${String(bucket.getMonth() + 1).padStart(2, "0")}`;
  }
  return bucket.toISOString().slice(0, 10);
}

export function bucketLabel(key: string, granularity: "day" | "week" | "month") {
  if (granularity === "month") {
    const [year, month] = key.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  }
  return new Date(`${key}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Builds a continuous series (empty buckets are filled with zero). */
export function buildSeries(
  orders: { createdAt: Date; total: number }[],
  range: DateRange,
  granularity: "day" | "week" | "month",
) {
  const buckets = new Map<string, { revenue: number; orders: number }>();
  const cursor = new Date(range.from);

  while (cursor <= range.to) {
    buckets.set(bucketKey(cursor, granularity), { revenue: 0, orders: 0 });
    if (granularity === "month") cursor.setMonth(cursor.getMonth() + 1);
    else if (granularity === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setDate(cursor.getDate() + 1);
  }

  for (const order of orders) {
    const key = bucketKey(order.createdAt, granularity);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.revenue += order.total;
    bucket.orders += 1;
  }

  return [...buckets.entries()].map(([key, value]) => ({
    key,
    label: bucketLabel(key, granularity),
    revenue: value.revenue,
    orders: value.orders,
  }));
}

export type Overview = {
  revenue: number;
  previousRevenue: number;
  sales: number;
  previousSales: number;
  orders: number;
  previousOrders: number;
  customers: number;
  newCustomers: number;
  activeCustomers: number;
  orderStatus: Record<string, number>;
  paymentStatus: Record<string, number>;
  pendingPayments: number;
  successfulPayments: number;
  refundRequests: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  averageOrderValue: number;
};

export async function getOverview(range: DateRange): Promise<Overview> {
  const span = range.to.getTime() - range.from.getTime();
  const previousRange = {
    from: new Date(range.from.getTime() - span),
    to: range.from,
  };

  const counted = { status: { not: "CANCELLED" } };

  const [
    revenue,
    previousRevenue,
    itemCount,
    previousItemCount,
    orderCount,
    previousOrderCount,
    orderStatusGroups,
    paymentStatusGroups,
    customerCount,
    newCustomers,
    activeCustomers,
    pendingPayments,
    successfulPayments,
    refundRequests,
    lowStock,
    outOfStock,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { total: true },
      where: { ...counted, createdAt: { gte: range.from, lte: range.to } },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { ...counted, createdAt: { gte: previousRange.from, lte: previousRange.to } },
    }),
    prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: { order: { ...counted, createdAt: { gte: range.from, lte: range.to } } },
    }),
    prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: {
        order: { ...counted, createdAt: { gte: previousRange.from, lte: previousRange.to } },
      },
    }),
    prisma.order.count({ where: { createdAt: { gte: range.from, lte: range.to } } }),
    prisma.order.count({
      where: { createdAt: { gte: previousRange.from, lte: previousRange.to } },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { createdAt: { gte: range.from, lte: range.to } },
    }),
    prisma.order.groupBy({
      by: ["paymentStatus"],
      _count: { _all: true },
      where: { createdAt: { gte: range.from, lte: range.to } },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({
      where: {
        role: "CUSTOMER",
        createdAt: { gte: range.from, lte: range.to },
      },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: range.from, lte: range.to } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.payment.count({
      where: { status: "PENDING", createdAt: { gte: range.from, lte: range.to } },
    }),
    prisma.payment.count({
      where: { status: "VERIFIED", createdAt: { gte: range.from, lte: range.to } },
    }),
    prisma.refundRequest.count({ where: { status: "PENDING" } }),
    prisma.product.count({ where: { stock: { gt: 0, lte: 10 } } }),
    prisma.product.count({ where: { stock: { lte: 0 } } }),
  ]);

  const orderStatus: Record<string, number> = {};
  for (const group of orderStatusGroups) {
    orderStatus[group.status] = group._count._all;
  }
  const paymentStatus: Record<string, number> = {};
  for (const group of paymentStatusGroups) {
    paymentStatus[group.paymentStatus] = group._count._all;
  }

  const revenueTotal = revenue._sum.total ?? 0;

  return {
    revenue: revenueTotal,
    previousRevenue: previousRevenue._sum.total ?? 0,
    sales: itemCount._sum.quantity ?? 0,
    previousSales: previousItemCount._sum.quantity ?? 0,
    orders: orderCount,
    previousOrders: previousOrderCount,
    customers: customerCount,
    newCustomers,
    activeCustomers: activeCustomers.length,
    orderStatus,
    paymentStatus,
    pendingPayments,
    successfulPayments,
    refundRequests,
    lowStockProducts: lowStock,
    outOfStockProducts: outOfStock,
    averageOrderValue:
      orderCount > 0 ? Math.round(revenueTotal / orderCount) : 0,
  };
}

export function growth(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

export async function getSalesSeries(
  range: DateRange,
  granularity: "day" | "week" | "month",
) {
  const orders = await prisma.order.findMany({
    where: {
      status: { not: "CANCELLED" },
      createdAt: { gte: range.from, lte: range.to },
    },
    select: { createdAt: true, total: true },
  });
  return buildSeries(orders, range, granularity);
}

export async function getCustomerSeries(
  range: DateRange,
  granularity: "day" | "week" | "month",
) {
  const users = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      createdAt: { gte: range.from, lte: range.to },
    },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  const cursor = new Date(range.from);
  while (cursor <= range.to) {
    buckets.set(bucketKey(cursor, granularity), 0);
    if (granularity === "month") cursor.setMonth(cursor.getMonth() + 1);
    else if (granularity === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setDate(cursor.getDate() + 1);
  }
  for (const user of users) {
    const key = bucketKey(user.createdAt, granularity);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([key, value]) => ({
    key,
    label: bucketLabel(key, granularity),
    revenue: value,
    orders: value,
  }));
}

export async function getBestSellingProducts(limit = 8) {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId", "name"],
    _sum: { quantity: true, price: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  const products = await prisma.product.findMany({
    where: { id: { in: grouped.map((item) => item.productId).filter(Boolean) as string[] } },
    select: { id: true, image: true },
  });
  const images = new Map(products.map((product) => [product.id, product.image]));

  return grouped.map((item) => ({
    name: item.name,
    quantity: item._sum.quantity ?? 0,
    revenue: (item._sum.quantity ?? 0) * (item._sum.price ?? 0),
    image: images.get(item.productId ?? "") ?? null,
  }));
}

export async function getCategoryPerformance() {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
  });
  if (grouped.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: grouped.map((item) => item.productId) as string[] } },
    select: { id: true, categoryId: true },
  });
  const categoryOf = new Map(products.map((product) => [product.id, product.categoryId]));
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });
  const nameOf = new Map(categories.map((category) => [category.id, category.name]));

  const totals = new Map<string, number>();
  for (const item of grouped) {
    const categoryId = categoryOf.get(item.productId ?? "");
    if (!categoryId) continue;
    totals.set(
      categoryId,
      (totals.get(categoryId) ?? 0) + (item._sum.quantity ?? 0),
    );
  }

  return [...totals.entries()]
    .map(([categoryId, quantity]) => ({
      label: nameOf.get(categoryId) ?? "Other",
      value: quantity,
    }))
    .sort((a, b) => b.value - a.value);
}

export async function getPaymentDistribution(range: DateRange) {
  const grouped = await prisma.order.groupBy({
    by: ["paymentMethod"],
    _count: { _all: true },
    where: { createdAt: { gte: range.from, lte: range.to } },
  });
  return grouped.map((group) => ({
    label: group.paymentMethod.toUpperCase(),
    value: group._count._all,
  }));
}

export async function getRevenueByDistrict(limit = 12) {
  const grouped = await prisma.order.groupBy({
    by: ["district"],
    _sum: { total: true },
    _count: { _all: true },
    where: { status: { not: "CANCELLED" } },
    orderBy: { _sum: { total: "desc" } },
    take: limit,
  });

  return grouped
    .filter((group) => group.district)
    .map((group) => ({
      label: group.district as string,
      value: group._sum.total ?? 0,
      orders: group._count._all,
    }));
}

export async function getTopCustomers(limit = 8) {
  const grouped = await prisma.order.groupBy({
    by: ["userId"],
    _sum: { total: true },
    _count: { _all: true },
    where: { userId: { not: null }, status: { not: "CANCELLED" } },
    orderBy: { _sum: { total: "desc" } },
    take: limit,
  });

  const users = await prisma.user.findMany({
    where: { id: { in: grouped.map((item) => item.userId).filter(Boolean) as string[] } },
    select: { id: true, name: true, email: true },
  });
  const usersById = new Map(users.map((user) => [user.id, user]));

  return grouped
    .map((item) => ({
      name: usersById.get(item.userId ?? "")?.name ?? "Guest",
      email: usersById.get(item.userId ?? "")?.email ?? "",
      revenue: item._sum.total ?? 0,
      orders: item._count._all,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}
