import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChatWidget } from "@/components/chat-widget";

export const metadata: Metadata = {
  title: {
    default: "ShopFront — Premium tech, audio, gaming & home",
    template: "%s · ShopFront",
  },
  description:
    "ShopFront is a modern storefront for premium audio, wearables, computing, photography, home and gaming gear. Free shipping over $150 and 30-day returns.",
  keywords: [
    "ecommerce",
    "online store",
    "electronics",
    "headphones",
    "laptops",
    "gaming",
  ],
  openGraph: {
    title: "ShopFront — Premium tech, audio, gaming & home",
    description:
      "Curated tech, audio, gaming and home goods with free shipping over $150.",
    type: "website",
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
