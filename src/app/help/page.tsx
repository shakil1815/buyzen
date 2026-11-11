import type { Metadata } from "next";
import Link from "next/link";
import {
  CreditCard,
  Mail,
  Package,
  RotateCcw,
  Truck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Help centre",
  description: "Shipping, returns, payments and answers to common questions.",
};

const FAQ = [
  {
    q: "How long does delivery take?",
    a: "Standard delivery takes 2-5 business days and is free on orders over $150. Orders placed before 4pm are dispatched the same working day, and you get a tracking link by email as soon as the parcel leaves the warehouse.",
  },
  {
    q: "Can I return an item?",
    a: "Yes. You can return any unopened item within 30 days of delivery for a full refund. We email a prepaid return label, and refunds are issued 3-5 days after the parcel is scanned back into our warehouse.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "All major credit and debit cards, Apple Pay, Google Pay, PayPal and Pay in 4. Your payment details are encrypted and we never store the full card number.",
  },
  {
    q: "Do you ship internationally?",
    a: "We ship to more than 40 countries. Duties and taxes are calculated at checkout so there are no surprises on delivery.",
  },
  {
    q: "How do I track my order?",
    a: "Sign in and open the Orders section of your account. Each order shows its live status and the tracking number for the carrier.",
  },
  {
    q: "Do you offer a warranty?",
    a: "Every product includes a 2-year warranty against manufacturing faults. If something goes wrong, contact support and we will arrange a repair or replacement.",
  },
];

export default function HelpPage() {
  return (
    <div className="container-page py-12">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-black tracking-tight text-ink-950">
          How can we help?
        </h1>
        <p className="mt-3 text-base text-ink-500">
          Everything about shipping, returns, payments and warranty — plus a
          friendly assistant in the corner of the screen if you would rather chat.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Truck,
            title: "Shipping",
            body: "Free over $150 · 2-5 business days",
          },
          {
            icon: RotateCcw,
            title: "Returns",
            body: "30 days, free label, quick refunds",
          },
          {
            icon: CreditCard,
            title: "Payments",
            body: "Cards, wallets, PayPal and Pay in 4",
          },
          {
            icon: Package,
            title: "Warranty",
            body: "2 years on everything we sell",
          },
        ].map((item) => (
          <div key={item.title} className="card flex items-center gap-3 p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <item.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">{item.title}</p>
              <p className="text-xs text-ink-500">{item.body}</p>
            </div>
          </div>
        ))}
      </div>

      <section id="faq" className="mt-14 scroll-mt-32">
        <h2 className="text-2xl font-black tracking-tight text-ink-950">
          Frequently asked questions
        </h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {FAQ.map((item) => (
            <div key={item.q} className="card p-5">
              <h3 className="text-sm font-bold text-ink-900">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="returns" className="mt-14 scroll-mt-32">
        <h2 className="text-2xl font-black tracking-tight text-ink-950">
          Returns &amp; refunds
        </h2>
        <div className="card mt-6 p-6 text-sm leading-relaxed text-ink-600">
          <p>
            Changed your mind? That is fine — most of our products can go back
            within 30 days as long as they are unopened and in their original
            packaging.
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5">
            <li>Open your account and find the order you want to return.</li>
            <li>Print the prepaid label we email you, or drop the parcel at any drop-off point.</li>
            <li>We refund the original payment method 3-5 days after the parcel is scanned.</li>
          </ol>
          <p className="mt-4">
            Sale items and opened audio gear are covered by our 2-year warranty
            instead. Reach us at{" "}
            <a
              href="mailto:support@shopfront.dev"
              className="font-semibold text-brand-600"
            >
              support@shopfront.dev
            </a>{" "}
            and we will sort it out.
          </p>
        </div>
      </section>

      <section id="contact" className="mt-14 scroll-mt-32">
        <h2 className="text-2xl font-black tracking-tight text-ink-950">
          Contact us
        </h2>
        <div className="card mt-6 flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">
                support@shopfront.dev
              </p>
              <p className="text-xs text-ink-500">
                We reply to every message within one business day.
              </p>
            </div>
          </div>
          <Link href="/products" className="btn btn-outline">
            Back to shopping
          </Link>
        </div>
      </section>
    </div>
  );
}
