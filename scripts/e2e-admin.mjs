/**
 * End-to-end smoke test #3: the admin back office.
 *
 *   node scripts/e2e-admin.mjs
 *
 * sign in -> create product -> edit product -> delete product
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
const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));

const productName = `Test Widget ${Date.now().toString().slice(-5)}`;

try {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", "admin@shopfront.dev");
  await page.fill("#password", "admin12345");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin/, { timeout: 20000 });

  // Create -------------------------------------------------------------
  await page.goto(`${BASE}/admin/products/new`, { waitUntil: "networkidle" });
  await page.fill("#name", productName);
  await page.fill(
    "#description",
    "A product created by the automated admin test to verify the CRUD flow.",
  );
  await page.fill("#price", "49.99");
  await page.fill("#compareAtPrice", "79.99");
  await page.fill("#stock", "25");
  await page.fill("#brand", "QA Labs");
  await page.getByRole("button", { name: "Create product" }).click();
  await page.waitForURL(/admin\/products/, { timeout: 20000 });
  await page
    .getByText(productName)
    .first()
    .waitFor({ timeout: 15000 })
    .catch(() => {});
  check(
    "product created and listed",
    await page.getByText(productName).first().isVisible(),
  );

  // Edit ---------------------------------------------------------------
  await page
    .getByRole("link", { name: `Edit ${productName}` })
    .click();
  await page.waitForTimeout(1200);
  await page.fill("#price", "39.99");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForTimeout(2000);
  await page.goto(`${BASE}/admin/products`, { waitUntil: "networkidle" });
  const row = page.locator("tbody tr", { hasText: productName }).first();
  check("price updated", (await row.textContent())?.includes("$39.99") ?? false);

  // Delete -------------------------------------------------------------
  await row.getByRole("button", { name: `Delete ${productName}` }).click();
  await page.waitForTimeout(2000);
  await page.goto(`${BASE}/admin/products`, { waitUntil: "networkidle" });
  check(
    "product deleted",
    (await page.getByText(productName).count()) === 0,
  );

  // Coupons -------------------------------------------------------------
  await page.goto(`${BASE}/admin/coupons`, { waitUntil: "networkidle" });
  check(
    "coupon table renders",
    (await page.locator("tbody tr").count()) >= 4,
  );

  // Orders -------------------------------------------------------------
  await page.goto(`${BASE}/admin/orders`, { waitUntil: "networkidle" });
  check(
    "orders table renders",
    (await page.locator("tbody tr").count()) >= 1,
  );

  // Customers ----------------------------------------------------------
  await page.goto(`${BASE}/admin/customers`, { waitUntil: "networkidle" });
  check(
    "customers table renders",
    (await page.locator("tbody tr").count()) >= 1,
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
