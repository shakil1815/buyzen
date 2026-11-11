"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex flex-col items-center gap-5 py-28 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-danger-soft text-danger-fg">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h1 className="text-2xl font-black tracking-tight text-fg-strong">
        {t("error.title")}
      </h1>
      <p className="max-w-md text-sm text-fg-muted">{t("error.body")}</p>
      <div className="flex gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          {t("error.retry")}
        </button>
        <Link href="/" className="btn btn-outline">
          {t("error.goHome")}
        </Link>
      </div>
    </div>
  );
}
