import { requirePermission } from "@/lib/permissions";
import {
  getConsentedMapPoints,
  getCustomerLocationsBy,
  getDeliveryLocationsBy,
} from "@/lib/admin/locations";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";
import { formatMoney } from "@/lib/format";
import { PageHeader, Panel } from "@/components/admin/ui";
import { HorizontalBars } from "@/components/admin/charts";
import {
  BangladeshMap,
  type ConsentedCustomer,
} from "@/components/admin/bangladesh-map";

export const metadata = { title: "Location analytics" };

export default async function AdminLocationsPage() {
  await requirePermission("locations.view");

  const [
    points,
    customers,
    divisions,
    districts,
    cities,
    countries,
    deliveryDistricts,
    deliveryDivisions,
    currency,
  ] = await Promise.all([
    getConsentedMapPoints(),
    prismaConsentedCustomers(),
    getCustomerLocationsBy("division"),
    getCustomerLocationsBy("district"),
    getCustomerLocationsBy("city"),
    getCustomerLocationsBy("country"),
    getDeliveryLocationsBy("district"),
    getDeliveryLocationsBy("division"),
    getCurrency(),
  ]);

  const rate = usdToBdtRate();
  const money = (cents: number) => formatMoney(cents, currency, rate);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Location analytics"
        description="Where customers live, where orders are delivered, and the map of consented locations."
      />

      <Panel
        title="Customer location map"
        description="Only customers who explicitly granted location consent appear here."
      >
        <BangladeshMap
          points={points}
          customers={customers as ConsentedCustomer[]}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Customers by division" description="Registration locations">
          <HorizontalBars
            points={divisions.map((row) => ({
              label: row.label,
              value: row.customers,
              hint: `${row.customers} customers`,
            }))}
          />
        </Panel>

        <Panel title="Orders by delivery division" description="Delivery locations">
          <HorizontalBars
            currency={currency}
            rate={rate}
            points={deliveryDivisions.map((row) => ({
              label: row.label,
              value: row.revenue,
              hint: `${row.orders} orders · ${money(row.revenue)}`,
            }))}
          />
        </Panel>

        <Panel title="Customers by district">
          <HorizontalBars
            points={districts.map((row) => ({
              label: row.label,
              value: row.customers,
              hint: `${row.customers} customers`,
            }))}
          />
        </Panel>

        <Panel title="Revenue by delivery district">
          <HorizontalBars
            currency={currency}
            rate={rate}
            points={deliveryDistricts.map((row) => ({
              label: row.label,
              value: row.revenue,
              hint: `${row.orders} orders · ${money(row.revenue)}`,
            }))}
          />
        </Panel>

        <Panel title="Customers by city">
          <HorizontalBars
            points={cities.map((row) => ({
              label: row.label,
              value: row.customers,
              hint: `${row.customers} customers`,
            }))}
          />
        </Panel>

        <Panel title="Customers by country">
          <HorizontalBars
            points={countries.map((row) => ({
              label: row.label,
              value: row.customers,
              hint: `${row.customers} customers`,
            }))}
          />
        </Panel>
      </div>

      <p className="text-[11px] text-fg-subtle">
        Delivery addresses and device geolocation are stored separately. The
        admin console only ever shows district-level aggregates for consented
        locations, and customers can withdraw consent from their profile.
      </p>
    </div>
  );
}

async function prismaConsentedCustomers() {
  const { prisma } = await import("@/lib/prisma");
  return prisma.user.findMany({
    where: { role: "CUSTOMER", locationConsent: true },
    select: {
      id: true,
      name: true,
      email: true,
      city: true,
      district: true,
      division: true,
    },
  });
}
