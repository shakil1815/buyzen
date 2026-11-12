import { NextResponse } from "next/server";
import { copyFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { getAdminContext } from "@/lib/permissions";
import { audit } from "@/lib/audit";

/**
 * Creates a timestamped copy of the SQLite database so it can be restored.
 * The file is written next to the database inside prisma/backups.
 */
export async function POST() {
  const admin = await getAdminContext();
  if (!admin || !admin.permissions.includes("settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const source = join(process.cwd(), "prisma", "dev.db");
  if (!existsSync(source)) {
    return NextResponse.json(
      { message: "No SQLite database file found at prisma/dev.db" },
      { status: 404 },
    );
  }

  const folder = join(process.cwd(), "prisma", "backups");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = join(folder, `dev-${stamp}.db`);

  try {
    const { mkdirSync } = await import("node:fs");
    mkdirSync(folder, { recursive: true });
    copyFileSync(source, target);

    await audit({
      actor: admin,
      action: "system.backup",
      entity: "Database",
      meta: { file: `prisma/backups/dev-${stamp}.db` },
    });

    return NextResponse.json({
      message: `Backup created (${Math.round(statSync(target).size / 1024)} KB)`,
    });
  } catch (error) {
    console.error("backup failed", error);
    return NextResponse.json(
      { message: "Backup failed - check filesystem permissions" },
      { status: 500 },
    );
  }
}
