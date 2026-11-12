import { prisma } from "@/lib/prisma";
import { DISTRICTS, findDistrict } from "@/lib/bangladesh";

export type LocationRow = {
  label: string;
  customers: number;
  orders: number;
  revenue: number;
};

export async function getCustomerLocationsBy(field: "division" | "district" | "city" | "country") {
  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: {
      division: true,
      district: true,
      city: true,
      country: true,
      locationConsent: true,
    },
  });

  const map = new Map<string, number>();
  for (const user of users) {
    const value = user[field];
    if (!value) continue;
    map.set(value, (map.get(value) ?? 0) + 1);
  }

  return [...map.entries()]
    .map(([label, customers]) => ({ label, customers }))
    .sort((a, b) => b.customers - a.customers);
}

export async function getDeliveryLocationsBy(
  field: "division" | "district" | "city" | "country",
) {
  const grouped = await prisma.order.groupBy({
    by: [field],
    _count: { _all: true },
    _sum: { total: true },
    where: { status: { not: "CANCELLED" } },
  });

  return grouped
    .filter((row) => row[field])
    .map((row) => ({
      label: row[field] as string,
      orders: row._count._all,
      revenue: row._sum.total ?? 0,
    }))
    .sort((a, b) => b.orders - a.orders);
}

export type MapPoint = {
  district: string;
  division: string;
  customers: number;
  revenue: number;
  orders: number;
};

/**
 * Consented customer locations grouped per district. Only customers who
 * explicitly granted location consent are counted, and the position used is
 * the district centroid - never a precise coordinate.
 */
export async function getConsentedMapPoints(): Promise<MapPoint[]> {
  const [customers, orders] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CUSTOMER", locationConsent: true },
      select: { id: true, name: true, district: true, division: true, city: true },
    }),
    prisma.order.groupBy({
      by: ["district"],
      _count: { _all: true },
      _sum: { total: true },
      where: { status: { not: "CANCELLED" } },
    }),
  ]);

  const orderStats = new Map(
    orders
      .filter((row) => row.district)
      .map((row) => [
        row.district as string,
        { orders: row._count._all, revenue: row._sum.total ?? 0 },
      ]),
  );

  const grouped = new Map<string, MapPoint>();
  for (const customer of customers) {
    const info = findDistrict(customer.district);
    if (!info) continue;
    const key = info.name;
    const existing = grouped.get(key) ?? {
      district: info.name,
      division: info.division,
      customers: 0,
      revenue: 0,
      orders: 0,
    };
    existing.customers += 1;
    grouped.set(key, existing);
  }

  for (const [district, point] of grouped) {
    const stats = orderStats.get(district);
    point.orders = stats?.orders ?? 0;
    point.revenue = stats?.revenue ?? 0;
  }

  // Include every known district so the map outline is complete.
  for (const district of DISTRICTS) {
    if (!grouped.has(district.name)) {
      const stats = orderStats.get(district.name);
      grouped.set(district.name, {
        district: district.name,
        division: district.division,
        customers: 0,
        revenue: stats?.revenue ?? 0,
        orders: stats?.orders ?? 0,
      });
    }
  }

  return [...grouped.values()];
}

export async function getConsentedCustomersInDistrict(district: string) {
  const info = findDistrict(district);
  if (!info) return [];

  const users = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      locationConsent: true,
      OR: [{ district: info.name }, { city: info.name }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      city: true,
      district: true,
      division: true,
    },
  });

  return users;
}
