import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });

await page.goto(`${BASE}/products`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

// Trigger lazy-loaded product images before capturing the full page.
await page.evaluate(async () => {
  const step = window.innerHeight;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((resolve) => setTimeout(resolve, 220));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(2500);
await page.screenshot({ path: "screenshots/contact-sheet.png", fullPage: true });
console.log("captured contact sheet");

await browser.close();
