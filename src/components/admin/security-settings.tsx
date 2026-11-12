"use client";

import { useState, useTransition } from "react";
import { Database, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";

export function SecuritySettings({
  settings,
  adminCount,
  orderCount,
  customerCount,
}: {
  settings: Record<string, string>;
  adminCount: number;
  orderCount: number;
  customerCount: number;
}) {
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sessionTimeout = settings.session_timeout_minutes ?? "60";
  const maxLoginAttempts = settings.max_login_attempts ?? "5";
  const requireTwoFactor = settings.require_2fa === "true";
  const maskSensitive = settings.mask_sensitive_data !== "false";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
          <ShieldCheck className="h-4 w-4 text-brand-fg" /> Authentication
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          {[
            ["Session timeout", `${sessionTimeout} minutes`],
            ["Max login attempts", String(maxLoginAttempts)],
            ["Two-factor for admins", requireTwoFactor ? "Required" : "Optional"],
            [
              "Sensitive data masking",
              maskSensitive ? "Enabled" : "Disabled",
            ],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <dt className="text-fg-muted">{label}</dt>
              <dd className="font-medium text-fg">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 flex items-start gap-2 text-[11px] text-fg-subtle">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Passwords are hashed with bcrypt and stored as a hash only. Sessions
          are signed httpOnly cookies; secrets are never returned to the browser
          or to the admin console.
        </p>
      </div>

      <div className="card p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
          <Database className="h-4 w-4 text-brand-fg" /> Data &amp; backups
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          {[
            ["Orders stored", String(orderCount)],
            ["Customers stored", String(customerCount)],
            ["Admin accounts", String(adminCount)],
            ["Database", "SQLite (file:./prisma/dev.db)"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <dt className="text-fg-muted">{label}</dt>
              <dd className="font-medium text-fg">{value}</dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const response = await fetch("/api/admin/backup", {
                method: "POST",
              });
              const data = (await response.json()) as { message?: string };
              setBackupMessage(
                data.message ?? "Backup could not be created right now.",
              );
            });
          }}
          className="btn btn-dark mt-4"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          Create database backup
        </button>
        {backupMessage ? (
          <p className="mt-2 text-xs font-semibold text-success-fg">
            {backupMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
