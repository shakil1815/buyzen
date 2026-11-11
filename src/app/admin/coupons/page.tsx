import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/format";
import { CouponForm } from "@/components/coupon-form-admin";
import { toggleCouponAction } from "@/lib/actions/admin";

export const metadata: Metadata = {
  title: "Coupons",
};

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-ink-950">
        Coupons
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Promo codes shoppers can apply in the cart.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Value</th>
                <th className="px-4 py-3 font-semibold">Min. order</th>
                <th className="px-4 py-3 font-semibold">Used</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink-900">{coupon.code}</p>
                    <p className="text-[11px] text-ink-400">
                      {coupon.description ?? "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {coupon.type === "PERCENT"
                      ? `${coupon.value}% off`
                      : `${formatMoney(coupon.value)} off`}
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {coupon.minSubtotal > 0
                      ? formatMoney(coupon.minSubtotal)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{coupon.usedCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        coupon.active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-ink-100 text-ink-500"
                      }`}
                    >
                      {coupon.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={toggleCouponAction.bind(null, coupon.id)}>
                      <button
                        type="submit"
                        className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:bg-ink-50"
                      >
                        {coupon.active ? "Disable" : "Enable"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <CouponForm />
          <div className="card mt-4 p-5 text-xs leading-relaxed text-ink-500">
            <p className="font-semibold text-ink-700">How coupons work</p>
            <p className="mt-1">
              Percentage codes are stored as whole points (10 = 10%), fixed codes
              as cents. The cart re-validates the minimum order value and
              expiry every time the totals are calculated.
            </p>
            <p className="mt-2">
              Created {coupons[0] ? formatDate(coupons[0].createdAt) : "—"}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
