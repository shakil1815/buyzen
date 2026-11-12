import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import {
  SEGMENT_KEYS,
  SEGMENT_LABELS,
  getSegmentCounts,
  getSegmentConfig,
} from "@/lib/admin/customers";
import { PageHeader, Panel } from "@/components/admin/ui";
import { SegmentCampaignForm } from "@/components/admin/segment-campaign-form";
import { SegmentConfigForm } from "@/components/admin/segment-config-form";

const RULES: Record<string, string> = {
  new: "Registered within the new-customer window and has placed at most one order.",
  returning: "Has placed two or more orders.",
  regular: "Has reached the regular-order count threshold.",
  high_value: "Lifetime spend above the high-value threshold, or five or more orders.",
  inactive: "Has ordered before but nothing within the inactivity window.",
  recently_registered: "Account created within the last seven days.",
};

export const metadata = { title: "Customer segments" };

export default async function AdminSegmentsPage() {
  await requirePermission("customers.view");

  const [counts, config] = await Promise.all([
    getSegmentCounts(),
    getSegmentConfig(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer segmentation"
        description="Segments are computed from real purchase activity and refresh automatically."
      />

      <Panel
        title="Segment rules"
        description="Thresholds are configuration - change them and every segment re-computes."
      >
        <SegmentConfigForm config={config} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        {SEGMENT_KEYS.map((key) => (
          <Panel
            key={key}
            title={SEGMENT_LABELS[key]}
            description={RULES[key]}
            actions={
              <Link
                href={`/admin/customers?segment=${key}`}
                className="text-xs font-semibold text-brand-fg"
              >
                View {counts[key]} customers
              </Link>
            }
          >
            <div className="flex items-center gap-4">
              <p className="text-3xl font-black tracking-tight text-fg-strong">
                {counts[key]}
              </p>
              <p className="text-xs text-fg-muted">customers in this segment</p>
            </div>
            <div className="mt-4">
              <SegmentCampaignForm segment={key} />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
