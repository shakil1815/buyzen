import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChatWidget } from "@/components/chat-widget";

export const metadata: Metadata = {
  title: {
    default: "BuyZen — Everything You Need. One Place.",
    template: "%s · BuyZen",
  },
  description:
    "BuyZen is a modern storefront for premium audio, wearables, computing, photography, home and gaming gear. Free shipping over $150 and 30-day returns.",
  keywords: [
    "ecommerce",
    "online store",
    "electronics",
    "headphones",
    "laptops",
    "gaming",
    "BuyZen",
  ],
  openGraph: {
    title: "BuyZen — Everything You Need. One Place.",
    description:
      "Premium audio, computing, gaming and home goods with free shipping over $150.",
    type: "website",
    images: ["/brand/buyzen-logo.svg"],
  },
};

/** Chrome for every storefront route (the admin console has its own shell). */
export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <ChatWidget />
    </>
  );
}
