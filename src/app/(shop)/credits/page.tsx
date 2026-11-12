import type { Metadata } from "next";
import Link from "next/link";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ExternalLink, Image as ImageIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Photo credits",
  description:
    "Product photography used in this demo store and where it comes from.",
};

type Credit = {
  path: string;
  artist: string;
  license: string;
  source: string;
};

export default async function CreditsPage() {
  const t = await getT();

  let credits: Record<string, Credit[]> = {};
  try {
    const raw = await readFile(
      join(process.cwd(), "public", "products", "photos", "credits.json"),
      "utf8",
    );
    credits = JSON.parse(raw) as Record<string, Credit[]>;
  } catch {
    credits = {};
  }

  const products = await prisma.product.findMany({
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container-page py-12">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-fg">
          <span className="h-px w-6 bg-brand-400" />
          BuyZen
        </span>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-fg-strong">
          {t("credits.title")}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-fg-muted">
          {t("credits.body")}
        </p>
      </div>

      <div className="card mt-10 overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-fg-subtle">
            <tr>
              <th className="px-4 py-3 font-semibold">{t("credits.product")}</th>
              <th className="px-4 py-3 font-semibold">{t("credits.photo")}</th>
              <th className="px-4 py-3 font-semibold">{t("credits.author")}</th>
              <th className="px-4 py-3 font-semibold">{t("credits.license")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((product) => {
              const files = credits[product.slug] ?? [];
              return (
                <tr key={product.slug}>
                  <td className="px-4 py-3 font-medium text-fg">
                    <Link
                      href={`/products/${product.slug}`}
                      className="hover:text-brand-fg"
                    >
                      {product.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {files[0] ? (
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/products/photos/${files[0].path}`}
                          alt=""
                          className="h-9 w-9 rounded-lg object-cover"
                        />
                        <span className="text-xs text-fg-muted">
                          {files.length} {t("credits.images")}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-fg-subtle">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-muted">
                    {files[0]?.artist ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {files[0] ? (
                      <a
                        href={files[0].source}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-brand-fg hover:underline"
                      >
                        {files[0].license}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-6 flex items-start gap-2 text-xs text-fg-muted">
        <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" />
        {t("credits.note")}
      </p>
    </div>
  );
}
