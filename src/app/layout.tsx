import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/components/i18n-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getCurrency, getTheme } from "@/lib/settings";
import { usdToBdtRate } from "@/lib/currency";

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
  openGraph: {
    title: "ShopFront — Premium tech, audio, gaming & home",
    description:
      "Curated tech, audio, gaming and home goods with free shipping over $150.",
    type: "website",
  },
};

/** Applies the saved theme before first paint to avoid a flash. */
const themeScript = `(function(){try{var c=document.cookie.split(';').map(function(p){return p.trim()}).find(function(p){return p.indexOf('sf_theme=')===0});var v=c?c.split('=')[1]:'system';var d=v==='dark'||(v==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, dictionary, currency, theme] = await Promise.all([
    getLocale(),
    getDictionary(),
    getCurrency(),
    getTheme(),
  ]);

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${
        theme === "dark" ? "dark" : ""
      }`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-surface text-fg">
        <ThemeProvider initialTheme={theme}>
          <I18nProvider
            locale={locale}
            dictionary={dictionary}
            currency={currency}
            usdToBdt={usdToBdtRate()}
          >
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
