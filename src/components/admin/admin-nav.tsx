"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { AdminIcon } from "@/components/admin/admin-icon";

export type AdminNavGroupData = {
  label: string;
  items: { href: string; label: string; icon: string }[];
};

/**
 * Sidebar navigation for the admin console. On phones it collapses behind a
 * menu button so the content gets the full width; from `lg` up it is a
 * permanent, sticky sidebar.
 */
export function AdminNav({
  groups,
  icons,
}: {
  groups: AdminNavGroupData[];
  icons: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="btn btn-outline mb-4 w-full justify-between lg:hidden"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Menu className="h-4 w-4" /> Menu
        </span>
        <ChevronDown
          className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      <nav
        className={`card p-3 lg:sticky lg:top-24 ${open ? "block" : "hidden lg:block"}`}
      >
        {groups.map((group) => (
          <div key={group.label} className="mb-3 last:mb-0">
            <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-fg-subtle">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-fg-muted transition hover:bg-surface-2 hover:text-fg-strong"
                >
                  <AdminIcon path={icons[item.icon]} className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}
