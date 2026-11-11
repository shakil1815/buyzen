// One-off codemod: rewrites the hard-coded ink/brand utilities to the
// semantic theme tokens so the whole app can switch between light and dark.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "src");

const replacements = [
  ["bg-white/", "bg-surface/"],
  ["bg-white", "bg-surface"],
  ["bg-ink-50/", "bg-surface-2/"],
  ["bg-ink-50", "bg-surface-2"],
  ["bg-ink-100", "bg-surface-3"],
  ["bg-brand-50", "bg-brand-soft"],
  ["border-ink-100", "border-line"],
  ["border-ink-200", "border-line-strong"],
  ["border-ink-300", "border-line-strong"],
  ["divide-ink-100", "divide-line"],
  ["ring-ink-100", "ring-line"],
  ["text-ink-950", "text-fg-strong"],
  ["text-ink-900", "text-fg"],
  ["text-ink-800", "text-fg"],
  ["text-ink-700", "text-fg-muted"],
  ["text-ink-600", "text-fg-muted"],
  ["text-ink-500", "text-fg-muted"],
  ["text-ink-400", "text-fg-subtle"],
  ["text-ink-300", "text-fg-subtle"],
  ["text-brand-700", "text-brand-fg"],
  ["text-brand-600", "text-brand-fg"],
  ["bg-emerald-50", "bg-success-soft"],
  ["text-emerald-600", "text-success-fg"],
  ["text-emerald-700", "text-success-fg"],
  ["text-emerald-800", "text-success-fg"],
  ["bg-amber-50", "bg-warn-soft"],
  ["text-amber-700", "text-warn-fg"],
  ["bg-rose-50", "bg-danger-soft"],
  ["text-rose-600", "text-danger-fg"],
  ["text-rose-700", "text-danger-fg"],
  ["bg-sky-50", "bg-info-soft"],
  ["text-sky-700", "text-info-fg"],
  ["placeholder:text-ink-400", "placeholder:text-fg-subtle"],
  ["placeholder:ink-400", "placeholder:fg-subtle"],
];

function walk(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(tsx|ts)$/.test(full)) continue;

    const original = readFileSync(full, "utf8");
    let updated = original;
    for (const [from, to] of replacements) {
      updated = updated.split(from).join(to);
    }
    if (updated !== original) {
      writeFileSync(full, updated, "utf8");
      console.log(`updated ${full.replace(process.cwd() + "\\", "")}`);
    }
  }
}

walk(ROOT);
console.log("done");
