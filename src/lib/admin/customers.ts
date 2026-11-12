import { prisma } from "@/lib/prisma";

export const SEGMENT_KEYS = [
  "new",
  "returning",
  "regular",
  "high_value",
  "inactive",
  "recently_registered",
] as const;

export type SegmentKey = (typeof SEGMENT_KEYS)[number];

export const SEGMENT_LABELS: Record<SegmentKey, string> = {
  new: "New customers",
  returning: "Returning customers",
  regular: "Regular customers",
  high_value: "High-value customers",
  inactive: "Inactive customers",
  recently_registered: "Recently registered",
};

export type SegmentConfig = {
  newDays: number;
  inactiveDays: number;
  regularOrders: number;
  highValueCents: number;
};

/** Segment thresholds are configuration, not hard-coded rules. */
export async function getSegmentConfig(): Promise<SegmentConfig> {
  const rows = await prisma.setting.findMany({
    where: { key: { startsWith: "segment_" } },
  });
  const values = new Map(rows.map((row) => [row.key, row.value]));

  const number = (key: string, fallback: number) => {
    const parsed = Number(values.get(key));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };

  return {
    newDays: number("segment_new_days", 30),
    inactiveDays: number("segment_inactive_days", 90),
    regularOrders: number("segment_regular_orders", 3),
    highValueCents: number("segment_high_value_cents", 50000),
  };
}

export type CustomerStats = {
  orders: number;
  spent: number;
  lastOrder: Date | null;
};

export type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  status: string;
  city: string | null;
  district: string | null;
  division: string | null;
  country: string;
  createdAt: Date;
  lastActiveAt: Date | null;
  locationConsent: boolean;
  orders: number;
  spent: number;
  lastOrder: Date | null;
  averageOrderValue: number;
  wishlistCount: number;
  segment: SegmentKey[];
};

export async function getCustomerStatsMap(): Promise<Map<string, CustomerStats>> {
  const grouped = await prisma.order.groupBy({
    by: ["userId"],
    where: { userId: { not: null }, status: { not: "CANCELLED" } },
    _count: { _all: true },
    _sum: { total: true },
    _max: { createdAt: true },
  });

  const map = new Map<string, CustomerStats>();
  for (const row of grouped) {
    if (!row.userId) continue;
    map.set(row.userId, {
      orders: row._count._all,
      spent: row._sum.total ?? 0,
      lastOrder: row._max.createdAt ?? null,
    });
  }
  return map;
}

export function computeSegments(
  user: {
    id: string;
    createdAt: Date;
    lastActiveAt: Date | null;
  },
  stats: CustomerStats | undefined,
  config: SegmentConfig,
  now = new Date(),
): SegmentKey[] {
  const segments: SegmentKey[] = [];
  const orders = stats?.orders ?? 0;
  const spent = stats?.spent ?? 0;
  const lastOrder = stats?.lastOrder ?? null;

  const ageDays = (now.getTime() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000);
  const daysSinceOrder = lastOrder
    ? (now.getTime() - lastOrder.getTime()) / (24 * 60 * 60 * 1000)
    : null;

  if (ageDays <= 7) segments.push("recently_registered");
  if (ageDays <= config.newDays && orders <= 1) segments.push("new");
  if (orders >= 2) segments.push("returning");
  if (orders >= config.regularOrders) segments.push("regular");
  if (spent >= config.highValueCents || orders >= 5) segments.push("high_value");
  if (
    orders > 0 &&
    daysSinceOrder !== null &&
    daysSinceOrder >= config.inactiveDays
  ) {
    segments.push("inactive");
  }

  return segments;
}

export type CustomerQuery = {
  q?: string;
  status?: string;
  segment?: string;
  sort?: string;
  page?: number;
  perPage?: number;
};

export async function getCustomerDirectory(query: CustomerQuery) {
  const config = await getSegmentConfig();
  const stats = await getCustomerStatsMap();

  const where = {
    role: "CUSTOMER",
    ...(query.status && query.status !== "all"
      ? { status: query.status }
      : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q } },
            { email: { contains: query.q } },
            { phone: { contains: query.q } },
            { city: { contains: query.q } },
            { district: { contains: query.q } },
          ],
        }
      : {}),
  };

  const [users, wishlistCounts] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        status: true,
        city: true,
        district: true,
        division: true,
        country: true,
        createdAt: true,
        lastActiveAt: true,
        locationConsent: true,
        wishlist: { select: { id: true } },
      },
    }),
    prisma.wishlistItem.groupBy({
      by: ["userId"],
      _count: { _all: true },
    }),
  ]);

  const wishlistByUser = new Map(
    wishlistCounts.map((row) => [row.userId, row._count._all]),
  );

  const now = new Date();
  let rows: CustomerRow[] = users.map((user) => {
    const userStats = stats.get(user.id);
    const segments = computeSegments(user, userStats, config, now);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      status: user.status,
      city: user.city,
      district: user.district,
      division: user.division,
      country: user.country,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
      locationConsent: user.locationConsent,
      orders: userStats?.orders ?? 0,
      spent: userStats?.spent ?? 0,
      lastOrder: userStats?.lastOrder ?? null,
      averageOrderValue:
        userStats && userStats.orders > 0
          ? Math.round(userStats.spent / userStats.orders)
          : 0,
      wishlistCount: wishlistByUser.get(user.id) ?? 0,
      segment: segments,
    };
  });

  if (query.segment && query.segment !== "all") {
    rows = rows.filter((row) => row.segment.includes(query.segment as SegmentKey));
  }

  const sorters: Record<string, (a: CustomerRow, b: CustomerRow) => number> = {
    newest: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    oldest: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    spent: (a, b) => b.spent - a.spent,
    orders: (a, b) => b.orders - a.orders,
    name: (a, b) => a.name.localeCompare(b.name),
  };
  rows.sort(sorters[query.sort ?? "newest"] ?? sorters.newest);

  const perPage = Math.min(Math.max(query.perPage ?? 20, 5), 100);
  const page = Math.max(query.page ?? 1, 1);
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const paginated = rows.slice((page - 1) * perPage, page * perPage);

  return {
    rows: paginated,
    total: rows.length,
    page,
    perPage,
    totalPages,
    config,
  };
}

export async function getSegmentCounts() {
  const config = await getSegmentConfig();
  const stats = await getCustomerStatsMap();
  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: { id: true, createdAt: true, lastActiveAt: true },
  });

  const counts = Object.fromEntries(
    SEGMENT_KEYS.map((key) => [key, 0]),
  ) as Record<SegmentKey, number>;

  for (const user of users) {
    for (const segment of computeSegments(user, stats.get(user.id), config)) {
      counts[segment] += 1;
    }
  }
  return counts;
}

export async function getCustomerProfile(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      status: true,
      blockReason: true,
      blockedAt: true,
      addressLine: true,
      city: true,
      district: true,
      division: true,
      country: true,
      postalCode: true,
      locationConsent: true,
      locationUpdatedAt: true,
      createdAt: true,
      lastActiveAt: true,
      orders: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
      addresses: { orderBy: { createdAt: "desc" } },
      wishlist: { include: { product: { select: { id: true, name: true, image: true, price: true } } } },
      activities: { orderBy: { createdAt: "desc" }, take: 50 },
      coupons: { select: { id: true, code: true, description: true } },
    },
  });

  if (!user) return null;

  const stats = await getCustomerStatsMap();
  const userStats = stats.get(user.id);
  const config = await getSegmentConfig();

  return {
    ...user,
    stats: {
      orders: userStats?.orders ?? 0,
      spent: userStats?.spent ?? 0,
      lastOrder: userStats?.lastOrder ?? null,
      averageOrderValue:
        userStats && userStats.orders > 0
          ? Math.round(userStats.spent / userStats.orders)
          : 0,
    },
    segments: computeSegments(user, userStats, config),
  };
}
