/**
 * End-to-end smoke test #2: the customer account journey.
 *
 *   node scripts/e2e-account.mjs
 *
 * register -> wishlist -> review -> order -> order history
 */
import { chromium } from "playwright-core";
import { randomUUID } from "node:crypto";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const results = [];
function check(name, ok, extra = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` -> ${extra}` : ""}`);
}

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));

const email = `shopper-${randomUUID().slice(0, 8)}@example.com`;

try {
  // 1. Register ------------------------------------------------------
  await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
  await page.fill("#name", "Sam Shopper");
  await page.fill("#email", email);
  await page.fill("#password", "supersecret123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/account/, { timeout: 20000 });
  check("account created and signed in", page.url().includes("/account"));

  // 2. Wishlist ------------------------------------------------------
  await page.goto(`${BASE}/products/pulse-x-smartwatch`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: "Save to wishlist" }).first().click();
  await page.waitForTimeout(1200);
  await page.goto(`${BASE}/account/wishlist`, { waitUntil: "networkidle" });
  check(
    "wishlist item saved",
    await page.getByText("Pulse X Smartwatch").first().isVisible(),
  );

  // 3. Review --------------------------------------------------------
  await page.goto(`${BASE}/products/pulse-x-smartwatch`, {
    waitUntil: "networkidle",
  });
  await page.fill("#review-title", "Excellent battery life");
  await page.fill(
    "#review-body",
    "I ran a full marathon with it and still had half the battery left.",
  );
  await page.getByRole("button", { name: "Publish review" }).click();
  await page.waitForTimeout(2000);
  await page.goto(`${BASE}/products/pulse-x-smartwatch`, {
    waitUntil: "networkidle",
  });
  check(
    "review published",
    await page.getByText("Excellent battery life").first().isVisible(),
  );

  // 4. Order + history -----------------------------------------------
  await page.goto(`${BASE}/products/glow-smart-bulb-4-pack`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: /^Add to cart$/i }).first().click();
  await page.waitForTimeout(1500);

  await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
  await page.fill("#email", email);
  await page.fill("#shippingName", "Sam Shopper");
  await page.fill("#address1", "12 Market Lane");
  await page.fill("#city", "Utrecht");
  await page.fill("#postalCode", "3511LN");
  await page.fill("#cardNumber", "4111111111111111");
  await page.fill("#expiry", "11/29");
  await page.fill("#cvc", "456");
  await page.getByRole("button", { name: /^Pay \$/ }).click();
  await page.waitForURL(/checkout\/success/, { timeout: 20000 });
  check("guest checkout completed", page.url().includes("/checkout/success"));

  await page.goto(`${BASE}/account/orders`, { waitUntil: "networkidle" });
  const orderRows = await page.locator("article").count();
  check("order appears in history", orderRows > 0, `${orderRows} orders`);
  check(
    "order shows Glow Smart Bulb",
    await page.getByText("Glow Smart Bulb 4-Pack").first().isVisible(),
  );

  // 5. Newsletter ----------------------------------------------------
  await page.goto(`${BASE}/help`, { waitUntil: "networkidle" });
  await page.fill("#newsletter-email", `news-${randomUUID().slice(0, 6)}@example.com`);
  await page.getByRole("button", { name: "Subscribe" }).click();
  await page.waitForTimeout(1500);
  check(
    "newsletter signup confirmed",
    await page.getByText(/You are subscribed/i).first().isVisible(),
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
