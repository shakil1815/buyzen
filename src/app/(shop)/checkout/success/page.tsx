import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Package, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/format";
import { getDateLocale, getT } from "@/lib/i18n/server";
import { getCurrency } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";

export const metadata: Metadata = {
  title: "Order confirmed",
  description: "Thanks for your order!",
};

export default async function CheckoutSuccessPage(
  props: PageProps<"/checkout/success">,
) {
  const searchParams = (await props.searchParams) as Record<
    string,
    string | string[] | undefined
  >;
  const number = Array.isArray(searchParams.order)
    ? searchParams.order[0]
    : (searchParams.order ?? "");
  const card = Array.isArray(searchParams.card)
    ? searchParams.card[0]
    : (searchParams.card ?? "");

  const [order, t, currency, dateLocale] = await Promise.all([
    number
      ? prisma.order.findUnique({
          where: { number },
          include: { items: true },
        })
      : Promise.resolve(null),
    getT(),
    getCurrency(),
    getDateLocale(),
  ]);
  const rate = usdToBdtRate();
  const money = (cents: number) => formatMoney(cents, currency, rate);

  return (
    <div className="container-page max-w-3xl py-16">
      <div className="card p-8 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success-soft text-success-fg">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-fg-strong">
          {t("success.title")}
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          {t("success.body", {
            order: number,
            payment: card ? t("success.paidWith", { card }) : "",
          })}
        </p>

        {order ? (
          <div className="mt-8 rounded-2xl border border-line bg-surface-2 p-5 text-left">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-fg-subtle">
                  {t("success.deliveringTo")}
                </p>
                <p className="mt-0.5 font-semibold text-fg">
                  {order.shippingName}
                </p>
                <p className="text-xs text-fg-muted">
                  {order.address1}
                  {order.address2 ? `, ${order.address2}` : ""}, {order.city}{" "}
                  {order.postalCode}, {order.country}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-fg-subtle">
                  {t("success.totalPaid")}
                </p>
                <p className="text-2xl font-black text-fg-strong">
                  {money(order.total)}
                </p>
                <p className="text-xs text-fg-muted">
                  {formatDate(order.createdAt, dateLocale)}
                </p>
              </div>
            </div>

            <ul className="mt-5 divide-y divide-line border-t border-line-strong">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-medium text-fg hover:text-brand-fg"
                  >
                    {item.name}
                  </Link>
                  <span className="text-xs text-fg-muted">
                    × {item.quantity} · {money(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/account/orders" className="btn btn-primary">
            {t("success.viewOrders")}
          </Link>
          <Link href="/products" className="btn btn-outline">
            {t("success.continue")}
          </Link>
        </div>

        <div className="mt-8 grid gap-4 border-t border-line pt-6 text-left sm:grid-cols-2">
          <div className="flex gap-3">
            <Package className="mt-0.5 h-4 w-4 shrink-0 text-brand-fg" />
            <div>
              <p className="text-xs font-semibold text-fg">
                {t("success.packedTitle")}
              </p>
              <p className="text-[11px] text-fg-muted">
                {t("success.packedBody")}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand-fg" />
            <div>
              <p className="text-xs font-semibold text-fg">
                {t("success.deliveredTitle")}
              </p>
              <p className="text-[11px] text-fg-muted">
                {t("success.deliveredBody")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
