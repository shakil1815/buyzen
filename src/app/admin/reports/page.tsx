import Link from "next/link";
import { Download, FileSpreadsheet } from "lucide-react";
import { requirePermission } from "@/lib/permissions";
import { PageHeader, Panel } from "@/components/admin/ui";

export const metadata = { title: "Reports & exports" };

const REPORTS = [
  {
    key: "customers",
    title: "Customer report",
    description:
      "Customer ID, profile, contact, registration date, order count, purchase value, last order, status and location consent.",
    permission: "customers.export",
  },
  {
    key: "orders",
    title: "Order report",
    description:
      "Every order with customer, delivery location, items, totals, status, payment state and tracking number.",
    permission: "orders.view",
  },
  {
    key: "payments",
    title: "Payment report",
    description:
      "Manual and gateway transactions with references, sender numbers, verification state and who verified them.",
    permission: "payments.view",
  },
  {
    key: "refunds",
    title: "Refund report",
    description: "Return and refund requests with amounts, reasons and decisions.",
    permission: "payments.view",
  },
  {
    key: "products",
    title: "Product performance",
    description: "Catalogue with price, cost, stock, threshold and rating per product.",
    permission: "products.import",
  },
  {
    key: "inventory",
    title: "Inventory report",
    description: "Stock on hand, low-stock thresholds and inventory valuation.",
    permission: "inventory.manage",
  },
  {
    key: "reviews",
    title: "Review report",
    description: "All customer reviews with moderation state and reported flags.",
    permission: "reviews.moderate",
  },
  {
    key: "coupons",
    title: "Coupon report",
    description: "Coupon codes with values, thresholds, usage and audience.",
    permission: "marketing.manage",
  },
  {
    key: "revenue",
    title: "Geographic sales report",
    description: "Revenue grouped by delivery district.",
    permission: "reports.view",
  },
];

export default async function AdminReportsPage() {
  await requirePermission("reports.view");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & export centre"
        description="Download the data behind every dashboard figure."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((report) => (
          <Panel key={report.key} title={report.title} description={report.description}>
            <Link
              href={`/api/admin/export/${report.key}`}
              className="btn btn-dark"
              aria-label={`Download ${report.title}`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Download CSV
            </Link>
          </Panel>
        ))}
      </div>

      <Panel title="Printing and PDFs">
        <p className="text-sm text-fg-muted">
          Every order has a print-optimised invoice page. Use your browser&apos;s
          print dialog and choose &ldquo;Save as PDF&rdquo; to produce a
          shareable PDF invoice without any extra tooling.
        </p>
        <Link href="/admin/orders" className="btn btn-outline mt-4">
          <Download className="h-4 w-4" /> Go to orders
        </Link>
      </Panel>
    </div>
  );
}
