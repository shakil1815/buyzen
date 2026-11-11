import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/format";
import { CouponForm } from "@/components/coupon-form-admin";
import { toggleCouponAction } from "@/lib/actions/admin";
import { getDateLocale, getT } from "@/lib/i18n/server";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Coupons",
};

export default async function AdminCouponsPage() {
  const [t, currency, dateLocale] = await Promise.all([
    getT(),
    getCurrency(),
    getDateLocale(),
  ]);
  const rate = usdToBdtRate();

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-fg-strong">
        {t("admin.coupons.title")}
      </h1>
      <p className="mt-1 text-sm text-fg-muted">{t("admin.coupons.body")}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-fg-subtle">
              <tr>
                <th className="px-4 py-3 font-semibold">
                  {t("admin.coupons.code")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {t("admin.coupons.value")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {t("admin.coupons.minOrder")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {t("admin.coupons.used")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {t("admin.coupons.status")}
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  {t("admin.coupons.action")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-fg">{coupon.code}</p>
                    <p className="text-[11px] text-fg-subtle">
                      {coupon.description ?? "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">
                    {coupon.type === "PERCENT"
                      ? `${coupon.value}% off`
                      : `${formatMoney(coupon.value, currency, rate)} off`}
                  </td>
                  <td className="px-4 py-3 text-fg-muted">
                    {coupon.minSubtotal > 0
                      ? formatMoney(coupon.minSubtotal, currency, rate)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{coupon.usedCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        coupon.active
                          ? "bg-success-soft text-success-fg"
                          : "bg-surface-3 text-fg-muted"
                      }`}
                    >
                      {coupon.active
                        ? t("admin.coupons.active")
                        : t("admin.coupons.disabled")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={toggleCouponAction.bind(null, coupon.id)}>
                      <button
                        type="submit"
                        className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-semibold text-fg-muted transition hover:bg-surface-2"
                      >
                        {coupon.active
                          ? t("admin.coupons.disable")
                          : t("admin.coupons.enable")}
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
          <div className="card mt-4 p-5 text-xs leading-relaxed text-fg-muted">
            <p className="font-semibold text-fg">{t("admin.coupons.code")}</p>
            <p className="mt-1">{t("admin.coupons.explain")}</p>
            <p className="mt-2">
              {coupons[0] ? formatDate(coupons[0].createdAt, dateLocale) : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
