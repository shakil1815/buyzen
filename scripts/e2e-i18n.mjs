/**
 * End-to-end test for the localisation, currency and theme features.
 *
 *   node scripts/e2e-i18n.mjs
 */
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const results = [];
function check(name, ok, extra = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` -> ${extra}` : ""}`);
}

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));

async function openSettings() {
  const panel = page.locator("text=/USD \\(\\$\\)|BDT \\(৳\\)/").first();
  if (await panel.isVisible().catch(() => false)) return;
  await page.getByRole("button", { name: /Change theme|থিম পরিবর্তন/i }).click();
  await page.waitForTimeout(500);
}

try {
  await page.goto(BASE, { waitUntil: "networkidle" });

  // 1. English + USD by default -------------------------------------
  check(
    "default copy is English",
    await page.getByText("Shop by category").first().isVisible(),
  );
  check(
    "default currency is USD",
    await page.locator("text=/^\\$[0-9]/").first().isVisible(),
  );

  // 2. Dark theme ---------------------------------------------------
  await openSettings();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.waitForTimeout(1500);
  const htmlClass = await page.locator("html").getAttribute("class");
  check("dark theme applies the dark class", htmlClass?.includes("dark") ?? false);

  // 3. Bangla -------------------------------------------------------
  await openSettings();
  await page.getByRole("button", { name: "বাংলা", exact: true }).click();
  await page.waitForTimeout(1800);
  check(
    "bangla copy is rendered",
    await page.getByText("ক্যাটাগরি অনুযায়ী কিনুন").first().isVisible(),
  );
  check(
    "html lang is bangla",
    (await page.locator("html").getAttribute("lang")) === "bn",
  );

  // 4. BDT currency --------------------------------------------------
  await openSettings();
  await page.getByRole("button", { name: "BDT (৳)", exact: true }).click();
  await page.waitForTimeout(1800);
  check(
    "prices are shown in taka",
    await page.locator("text=৳").first().isVisible(),
  );

  // 5. Bangla AI assistant -------------------------------------------
  await page.getByRole("button", { name: /সহায়ককে জিজ্ঞাসা করুন|Ask the assistant/i }).click();
  await page.fill("#chat-input", "গেমিং কন্ট্রোলার দেখান");
  await page.getByRole("button", { name: /বার্তা পাঠান|Send message/i }).click();
  await page.waitForTimeout(2500);
  const chatReply = await page.locator("text=/পাওয়া|কন্ট্রোলার/").first().isVisible();
  check("assistant replies in bangla", chatReply);

  // 6. Settings persist ----------------------------------------------
  await page.goto(`${BASE}/products`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  check(
    "preferences persist across pages",
    (await page.locator("html").getAttribute("lang")) === "bn" &&
      (await page.locator("text=৳").first().isVisible()),
  );
} catch (error) {
  check("test run completed", false, String(error).slice(0, 200));
} finally {
  console.log(`\nconsole errors: ${errors.length}`);
  errors.slice(0, 5).forEach((message) => console.log(`  - ${message}`));
  console.log(
    `\n${results.filter((result) => result.ok).length}/${results.length} checks passed`,
  );
  await browser.close();
}
