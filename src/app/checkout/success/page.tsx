import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Package, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/format";

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

  const order = number
    ? await prisma.order.findUnique({
        where: { number },
        include: { items: true },
      })
    : null;

  return (
    <div className="container-page max-w-3xl py-16">
      <div className="card p-8 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-ink-950">
          Thanks for your order!
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Order <strong className="text-ink-900">{number}</strong> is confirmed
          {card ? (
            <>
              {" "}
              and paid with card <strong className="text-ink-900">{card}</strong>
            </>
          ) : null}
          . A receipt is on its way to your inbox.
        </p>

        {order ? (
          <div className="mt-8 rounded-2xl border border-ink-100 bg-ink-50/60 p-5 text-left">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-400">
                  Delivering to
                </p>
                <p className="mt-0.5 font-semibold text-ink-900">
                  {order.shippingName}
                </p>
                <p className="text-xs text-ink-500">
                  {order.address1}
                  {order.address2 ? `, ${order.address2}` : ""}, {order.city}{" "}
                  {order.postalCode}, {order.country}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-ink-400">
                  Total paid
                </p>
                <p className="text-2xl font-black text-ink-950">
                  {formatMoney(order.total)}
                </p>
                <p className="text-xs text-ink-500">{formatDate(order.createdAt)}</p>
              </div>
            </div>

            <ul className="mt-5 divide-y divide-ink-100 border-t border-ink-200">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-medium text-ink-800 hover:text-brand-600"
                  >
                    {item.name}
                  </Link>
                  <span className="text-xs text-ink-500">
                    × {item.quantity} · {formatMoney(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/account/orders" className="btn btn-primary">
            View my orders
          </Link>
          <Link href="/products" className="btn btn-outline">
            Continue shopping
          </Link>
        </div>

        <div className="mt-8 grid gap-4 border-t border-ink-100 pt-6 text-left sm:grid-cols-2">
          <div className="flex gap-3">
            <Package className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <div>
              <p className="text-xs font-semibold text-ink-900">
                Packed within 24 hours
              </p>
              <p className="text-[11px] text-ink-500">
                Tracking details are emailed the moment your parcel leaves the
                warehouse.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <div>
              <p className="text-xs font-semibold text-ink-900">
                Delivered in 2-5 days
              </p>
              <p className="text-[11px] text-ink-500">
                Free shipping applied to orders over $150.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
