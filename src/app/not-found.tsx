import Link from "next/link";
import { Home, Search } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getT();

  return (
    <div className="container-page flex flex-col items-center gap-5 py-28 text-center">
      <p className="text-7xl font-black tracking-tight text-brand-600">404</p>
      <h1 className="text-2xl font-black tracking-tight text-fg-strong">
        {t("notFound.title")}
      </h1>
      <p className="max-w-md text-sm text-fg-muted">{t("notFound.body")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          <Home className="h-4 w-4" /> {t("common.home")}
        </Link>
        <Link href="/products" className="btn btn-outline">
          <Search className="h-4 w-4" /> {t("notFound.browse")}
        </Link>
      </div>
    </div>
  );
}
