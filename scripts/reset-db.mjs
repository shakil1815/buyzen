/**
 * Resets the local SQLite database: drops the file, applies the migrations and
 * re-seeds the demo data.
 *
 *   npm run db:reset
 */
import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const dbFile = join(process.cwd(), "prisma", "dev.db");

if (existsSync(dbFile)) {
  rmSync(dbFile, { force: true });
  console.log("removed prisma/dev.db");
}
for (const suffix of ["-journal", "-wal", "-shm"]) {
  const file = `${dbFile}${suffix}`;
  if (existsSync(file)) rmSync(file, { force: true });
}

execSync("npx prisma migrate deploy", { stdio: "inherit" });
execSync("npm run db:seed", { stdio: "inherit" });

console.log("database reset and seeded");
