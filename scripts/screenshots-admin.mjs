import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUT = "screenshots";

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 } });
const page = await context.newPage();

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "admin@buyzen.com");
await page.fill("#password", "admin12345");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(/\/admin/, { timeout: 20000 });
await page.waitForTimeout(1500);

const pages = [
  ["admin-dashboard", "/admin"],
  ["admin-customers", "/admin/customers"],
  ["admin-segments", "/admin/segments"],
  ["admin-locations", "/admin/locations"],
  ["admin-orders", "/admin/orders"],
  ["admin-payments", "/admin/payments"],
  ["admin-inventory", "/admin/inventory"],
  ["admin-marketing", "/admin/marketing"],
  ["admin-reports", "/admin/reports"],
  ["admin-settings", "/admin/settings"],
];

for (const [name, path] of pages) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`captured ${name}`);
}

// Mobile view of the admin console
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const mobilePage = await mobile.newPage();
await mobilePage.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await mobilePage.fill("#email", "admin@buyzen.com");
await mobilePage.fill("#password", "admin12345");
await mobilePage.getByRole("button", { name: "Sign in" }).click();
await mobilePage.waitForURL(/\/admin/, { timeout: 20000 });
await mobilePage.waitForTimeout(1200);
await mobilePage.screenshot({ path: `${OUT}/admin-mobile.png` });
console.log("captured admin-mobile");

await browser.close();
