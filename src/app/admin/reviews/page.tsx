import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/admin/ui";
import { ReviewActions } from "@/components/admin/review-actions";

export const metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  await requirePermission("reviews.moderate");

  const [reviews, pending, reported] = await Promise.all([
    prisma.review.findMany({
      include: {
        product: { select: { name: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: [{ reported: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.review.count({ where: { reported: true } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews & ratings"
        description={`${pending} awaiting moderation · ${reported} reported`}
      />

      <Panel>
        {reviews.length === 0 ? (
          <EmptyState title="No reviews yet" />
        ) : (
          <DataTable
            head={["Product", "Customer", "Rating", "Review", "Status", "Action"]}
          >
            {reviews.map((review) => (
              <tr key={review.id}>
                <td className="px-3 py-3">
                  <a
                    href={`/products/${review.product.slug}`}
                    className="font-medium text-fg hover:text-brand-fg"
                  >
                    {review.product.name}
                  </a>
                </td>
                <td className="px-3 py-3 text-fg-muted">
                  {review.user.name}
                  <p className="text-[11px] text-fg-subtle">{review.user.email}</p>
                </td>
                <td className="px-3 py-3 text-fg">★ {review.rating}</td>
                <td className="px-3 py-3">
                  <p className="text-sm font-medium text-fg">{review.title}</p>
                  <p className="text-[11px] text-fg-subtle">
                    {review.body.slice(0, 90)}
                    {review.body.length > 90 ? "…" : ""}
                  </p>
                  <p className="text-[10px] text-fg-subtle">
                    {formatDate(review.createdAt)}
                    {review.verifiedPurchase ? " · verified purchase" : ""}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <StatusBadge
                    tone={
                      review.reported
                        ? "red"
                        : review.status === "APPROVED"
                          ? "green"
                          : review.status === "REJECTED"
                            ? "grey"
                            : "amber"
                    }
                  >
                    {review.reported ? "REPORTED" : review.status}
                  </StatusBadge>
                </td>
                <td className="px-3 py-3">
                  <ReviewActions reviewId={review.id} />
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
