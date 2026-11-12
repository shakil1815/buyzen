import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });

// Catalogue contact sheet (light)
await page.goto(`${BASE}/products`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: "screenshots/contact-sheet.png", fullPage: true });

// Admin dashboard
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "admin@shopfront.dev");
await page.fill("#password", "admin12345");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(/\/admin/, { timeout: 20000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: "screenshots/admin-dashboard.png", fullPage: true });

// Admin product edit form
await page.goto(`${BASE}/admin/products`, { waitUntil: "networkidle" });
await page.locator('a[aria-label^="Edit"]').first().click();
await page.waitForTimeout(1500);
await page.screenshot({ path: "screenshots/admin-product-form.png", fullPage: true });

// Credits page
await page.goto(`${BASE}/credits`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: "screenshots/credits.png" });

console.log("captured admin + credits");
await browser.close();
