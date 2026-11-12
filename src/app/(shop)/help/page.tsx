import type { Metadata } from "next";
import Link from "next/link";
import {
  CreditCard,
  Mail,
  Package,
  RotateCcw,
  Truck,
} from "lucide-react";
import { getT, getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Help centre",
  description: "Shipping, returns, payments and answers to common questions.",
};

const FAQ = {
  en: [
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
  ],
  bn: [
    {
      q: "ডেলিভারিতে কত সময় লাগে?",
      a: "স্ট্যান্ডার্ড ডেলিভারিতে ২-৫ কার্যদিবস লাগে এবং ৳১৫০ (বা $150) এর বেশি অর্ডারে এটি সম্পূর্ণ ফ্রি। বিকেল ৪টার আগে দেওয়া অর্ডার সেই দিনেই পাঠানো হয় এবং পার্সেল ওয়্যারহাউস থেকে বের হওয়ামাত্র ইমেইলে ট্র্যাকিং লিংক পাঠানো হয়।",
    },
    {
      q: "পণ্য ফেরত দেওয়া যাবে?",
      a: "হ্যাঁ। ডেলিভারির ৩০ দিনের মধ্যে অব্যবহৃত যেকোনো পণ্য ফেরত দিয়ে সম্পূর্ণ টাকা ফেরত পাওয়া যায়। আমরা প্রি-পেইড রিটার্ন লেবেল পাঠাই এবং পার্সেল স্ক্যান হওয়ার ৩-৫ দিনের মধ্যে টাকা ফেরত দেওয়া হয়।",
    },
    {
      q: "কোন কোন পেমেন্ট পদ্ধতি গ্রহণ করেন?",
      a: "সব প্রধান ক্রেডিট ও ডেবিট কার্ড, অ্যাপল পে, গুগল পে, পেপাল এবং কিস্তিতে পেমেন্ট। আপনার পেমেন্ট তথ্য এনক্রিপ্টেড থাকে এবং আমরা কখনো পুরো কার্ড নম্বর সংরক্ষণ করি না।",
    },
    {
      q: "আপনারা কি আন্তর্জাতিকভাবে ডেলিভারি করেন?",
      a: "আমরা ৪০টির বেশি দেশে ডেলিভারি করি। চুক্তি ও কর চেকআউটেই হিসাব হয়, তাই ডেলিভারিতে কোনো চমক থাকে না।",
    },
    {
      q: "অর্ডার কীভাবে ট্র্যাক করব?",
      a: "সাইন ইন করে আপনার অ্যাকাউন্টের Orders অংশে যান। প্রতিটি অর্ডারে লাইভ স্ট্যাটাস ও ক্যারিয়ারের ট্র্যাকিং নম্বর দেখা যাবে।",
    },
    {
      q: "ওয়ারেন্টি দেওয়া হয়?",
      a: "প্রতিটি পণ্যে উৎপাদনগত ত্রুটির বিরুদ্ধে ২ বছরের ওয়ারেন্টি রয়েছে। সমস্যা হলে সাপোর্টে যোগাযোগ করুন, আমরা মেরামত বা বদলে দেব।",
    },
  ],
};

export default async function HelpPage() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const faq = FAQ[locale === "bn" ? "bn" : "en"];

  return (
    <div className="container-page py-12">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-fg">
          <span className="h-px w-6 bg-brand-400" />
          BuyZen
        </span>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-fg-strong">
          {t("help.title")}
        </h1>
        <p className="mt-3 text-base text-fg-muted">{t("help.body")}</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Truck,
            title: t("help.shipping"),
            body: t("help.shippingBody"),
          },
          {
            icon: RotateCcw,
            title: t("help.returns"),
            body: t("help.returnsTag"),
          },
          {
            icon: CreditCard,
            title: t("help.payments"),
            body: t("help.paymentsBody"),
          },
          {
            icon: Package,
            title: t("help.warranty"),
            body: t("help.warrantyBody"),
          },
        ].map((item) => (
          <div key={item.title} className="card flex items-center gap-3 p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand-fg">
              <item.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-fg">{item.title}</p>
              <p className="text-xs text-fg-muted">{item.body}</p>
            </div>
          </div>
        ))}
      </div>

      <section id="faq" className="mt-14 scroll-mt-32">
        <h2 className="text-2xl font-black tracking-tight text-fg-strong">
          {t("help.faq")}
        </h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {faq.map((item) => (
            <div key={item.q} className="card p-5">
              <h3 className="text-sm font-bold text-fg">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="returns" className="mt-14 scroll-mt-32">
        <h2 className="text-2xl font-black tracking-tight text-fg-strong">
          {t("help.returnsTitle")}
        </h2>
        <div className="card mt-6 p-6 text-sm leading-relaxed text-fg-muted">
          <p>{t("help.returnsBody")}</p>
          <ol className="mt-4 list-decimal space-y-2 pl-5">
            <li>{t("help.returnsSteps1")}</li>
            <li>{t("help.returnsSteps2")}</li>
            <li>{t("help.returnsSteps3")}</li>
          </ol>
          <p className="mt-4">
            {t("help.returnsContact", { email: "support@buyzen.com" })}
          </p>
        </div>
      </section>

      <section id="contact" className="mt-14 scroll-mt-32">
        <h2 className="text-2xl font-black tracking-tight text-fg-strong">
          {t("help.contactTitle")}
        </h2>
        <div className="card mt-6 flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand-fg">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-fg">
                support@buyzen.com
              </p>
              <p className="text-xs text-fg-muted">{t("help.contactBody")}</p>
            </div>
          </div>
          <Link href="/products" className="btn btn-outline">
            {t("help.backToShopping")}
          </Link>
        </div>
      </section>
    </div>
  );
}
