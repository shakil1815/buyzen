import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChatWidget } from "@/components/chat-widget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <ChatWidget />
      </body>
    </html>
  );
}
