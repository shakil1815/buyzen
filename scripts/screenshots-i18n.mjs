/** Captures the store in light/dark themes and English/Bangla with USD/BDT. */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUT = "screenshots";

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));

async function openSettings() {
  const panel = page.locator("text=/USD \\(\\$\\)|BDT \\(৳\\)/").first();
  if (await panel.isVisible().catch(() => false)) return;
  await page
    .getByRole("button", { name: /Change theme|থিম পরিবর্তন/i })
    .click();
  await page.waitForTimeout(500);
}

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/theme-light-usd-en.png` });
console.log("captured light / USD / English");

// Dark theme
await openSettings();
await page.getByRole("button", { name: "Dark", exact: true }).click();
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}/theme-dark-usd-en.png` });
console.log("captured dark / USD / English");

// Bangla + BDT
await openSettings();
await page.getByRole("button", { name: "বাংলা", exact: true }).click();
await page.waitForTimeout(2000);
await openSettings();
await page.getByRole("button", { name: "BDT (৳)", exact: true }).click();
await page.waitForTimeout(2000);
await page.screenshot({ path: `${OUT}/theme-dark-bdt-bn.png` });
console.log("captured dark / BDT / Bangla");

await page.goto(`${BASE}/products`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/bn-products.png` });
console.log("captured Bangla catalogue");

await page.goto(`${BASE}/products/arcade-pro-controller`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/bn-product.png` });
console.log("captured Bangla product page");

console.log(`console errors: ${errors.length}`);
errors.slice(0, 5).forEach((message) => console.log(`  - ${message}`));
await browser.close();
