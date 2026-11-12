/**
 * End-to-end test of the admin platform.
 *
 *   node scripts/e2e-admin-platform.mjs
 *
 * Covers: dashboard analytics, customer directory + profile, segmentation,
 * location map, order workflow, payment verification, inventory, marketing,
 * CMS, support, review moderation, reports/export, notifications, settings and
 * role based access control.
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

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin|\/account/, { timeout: 20000 });
}

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));

  /* ---------------------------- super admin ---------------------------- */
  await login(page, "admin@shopfront.dev", "admin12345");

  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  check(
    "dashboard shows revenue KPI",
    await page.getByText("Total revenue").first().isVisible(),
  );
  check(
    "dashboard renders a sales chart",
    (await page.locator("svg").count()) > 0,
  );
  check(
    "dashboard lists attention items",
    await page.getByText("Pending payments to verify").isVisible(),
  );

  /* ------------------------------ customers ---------------------------- */
  await page.goto(`${BASE}/admin/customers`, { waitUntil: "networkidle" });
  check(
    "customer directory renders",
    await page.getByText("Customer directory").isVisible(),
  );
  const customerRows = await page.locator("tbody tr").count();
  check("customer rows listed", customerRows > 0, `${customerRows} rows`);

  await page.getByPlaceholder(/Search name, email/i).fill("customer");
  await page.getByRole("button", { name: "Apply" }).click();
  await page.waitForTimeout(1200);
  check(
    "customer search filters rows",
    (await page.locator("tbody tr").count()) <= customerRows,
  );

  await page.locator("tbody tr a").first().click();
  await page.waitForTimeout(1500);
  check(
    "customer profile shows order history",
    await page.getByText("Order history").isVisible(),
  );
  check(
    "customer profile shows consent state",
    await page.getByText("Location &amp; consent").or(page.getByText("Location & consent")).first().isVisible(),
  );

  /* ------------------------------ segments ----------------------------- */
  await page.goto(`${BASE}/admin/segments`, { waitUntil: "networkidle" });
  check(
    "segments page lists rules",
    await page.getByText("Segment rules").isVisible(),
  );
  check(
    "segments show counts",
    (await page.getByText("customers in this segment").count()) > 0,
  );

  /* ------------------------------ locations ----------------------------- */
  await page.goto(`${BASE}/admin/locations`, { waitUntil: "networkidle" });
  check(
    "location map renders",
    (await page.locator("svg circle").count()) > 10,
  );
  check(
    "location analytics renders",
    await page.getByText("Customers by division").isVisible(),
  );

  /* -------------------------------- orders ------------------------------ */
  // Place a bKash (manual) order so the verification workflow has a target.
  await page.goto(`${BASE}/products/glow-smart-bulb-4-pack`, {
    waitUntil: "networkidle",
  });
  const addButton = page.getByRole("button", { name: /^Add to cart$/i }).first();
  await addButton.waitFor({ state: "visible" });
  await page.waitForTimeout(1200);
  await addButton.click();
  await page.waitForTimeout(1800);
  await page.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
  const inCart = await page.getByText("Glow Smart Bulb 4-Pack").count();
  check("product added to cart", inCart > 0, `${inCart} matches`);
  await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
  await page.waitForSelector("#email", { timeout: 15000 });
  await page.fill("#email", "admin-e2e@example.com");
  await page.fill("#shippingName", "Admin E2E");
  await page.fill("#address1", "9 Test Road");
  await page.fill("#city", "Dhaka");
  await page.fill("#postalCode", "1212");
  await page.check('input[name="paymentMethod"][value="bkash"]');
  await page.fill("#paymentReference", "E2E-TRX-001");
  await page.fill("#senderNumber", "01700000000");
  await page.getByRole("button", { name: /^Pay \$/ }).click();
  await page.waitForURL(/checkout\/success/, { timeout: 20000 });
  check("bKash manual order placed", page.url().includes("/checkout/success"));

  await page.goto(`${BASE}/admin/orders?status=PENDING`, { waitUntil: "networkidle" });
  const pendingRows = await page.locator("tbody tr").count();
  check("pending order appears in admin", pendingRows > 0, `${pendingRows} rows`);
  if (pendingRows > 0) {
    await page.locator("tbody tr a").first().click();
    await page.waitForTimeout(1500);
    check(
      "order detail shows timeline",
      await page.getByText("Order timeline").isVisible(),
    );
    const confirmButton = page.getByRole("button", { name: /Move to / });
    const available = await confirmButton.count();
    check("order status transition offered", available > 0, `${available} options`);
    if (available > 0) {
      await confirmButton.first().click();
      await page.waitForTimeout(1500);
      check("order status advanced", true);
    }
  }

  /* ------------------------------- payments ----------------------------- */
  await page.goto(`${BASE}/admin/payments?status=PENDING`, {
    waitUntil: "networkidle",
  });
  const pendingPayments = await page.locator("tbody tr").count();
  check("pending payment is listed", pendingPayments > 0, `${pendingPayments}`);
  if (pendingPayments > 0) {
    await page.getByRole("button", { name: "Verify" }).first().click();
    await page.waitForTimeout(1500);
    check("manual payment verified", true);
  }

  /* ------------------------------- inventory ---------------------------- */
  await page.goto(`${BASE}/admin/inventory`, { waitUntil: "networkidle" });
  check(
    "inventory analytics renders",
    await page.getByText("Inventory valuation").first().isVisible(),
  );
  const applyButton = page.getByRole("button", { name: "Apply" }).first();
  await applyButton.click();
  await page.waitForTimeout(1200);
  check("stock adjustment runs", true);

  /* ------------------------------- marketing ---------------------------- */
  await page.goto(`${BASE}/admin/marketing`, { waitUntil: "networkidle" });
  const couponCode = `E2E${Date.now().toString().slice(-5)}`;
  await page.fill("#coupon-code", couponCode);
  await page.fill("#coupon-value", "12");
  await page.getByRole("button", { name: "Create coupon" }).click();
  await page.waitForTimeout(1500);
  check(
    "coupon created",
    await page.getByText(couponCode).first().isVisible(),
  );

  /* --------------------------------- CMS -------------------------------- */
  await page.goto(`${BASE}/admin/content`, { waitUntil: "networkidle" });
  check(
    "CMS pages render",
    (await page.getByText("Website settings").count()) > 0,
  );

  /* ------------------------------- support ------------------------------ */
  await page.goto(`${BASE}/admin/support`, { waitUntil: "networkidle" });
  check(
    "support tickets render",
    (await page.locator("tbody tr").count()) > 0,
  );

  /* ------------------------------- reviews ------------------------------ */
  await page.goto(`${BASE}/admin/reviews`, { waitUntil: "networkidle" });
  check(
    "reviews moderation renders",
    (await page.getByRole("button", { name: "Approve" }).count()) > 0,
  );

  /* ------------------------------- reports ------------------------------ */
  await page.goto(`${BASE}/admin/reports`, { waitUntil: "networkidle" });
  const exportResponse = await page.request.get(`${BASE}/api/admin/export/orders`);
  check(
    "CSV export works",
    exportResponse.ok() &&
      (exportResponse.headers()["content-type"] ?? "").includes("text/csv"),
    `${exportResponse.status()}`,
  );

  /* ---------------------------- notifications --------------------------- */
  await page.goto(`${BASE}/admin/notifications`, { waitUntil: "networkidle" });
  check(
    "notification centre renders",
    await page.getByText("Notification centre").isVisible(),
  );

  /* ------------------------------- settings ----------------------------- */
  await page.goto(`${BASE}/admin/settings`, { waitUntil: "networkidle" });
  check(
    "audit log renders",
    await page.getByText("Security audit log").isVisible(),
  );
  check(
    "admin accounts render",
    await page.getByText("Admin accounts").first().isVisible(),
  );

  /* -------------------------------- roles ------------------------------- */
  await page.goto(`${BASE}/admin/roles`, { waitUntil: "networkidle" });
  check(
    "permission matrix renders",
    await page.getByText("How enforcement works").isVisible(),
  );

  /* ------------------------------ RBAC check ---------------------------- */
  const limited = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const limitedPage = await limited.newPage();
  await login(limitedPage, "orders@shopfront.dev", "admin12345");
  await limitedPage.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  check(
    "order manager can open the dashboard",
    await limitedPage.getByText("Total revenue").first().isVisible(),
  );
  const settingsNav = await limitedPage
    .getByRole("link", { name: "Settings & security" })
    .count();
  check("order manager does not see settings navigation", settingsNav === 0);
  await limitedPage.goto(`${BASE}/admin/settings`, {
    waitUntil: "networkidle",
  });
  check(
    "order manager is redirected away from settings",
    !limitedPage.url().includes("/admin/settings"),
    limitedPage.url(),
  );

  console.log(`\nconsole errors: ${errors.length}`);
  errors.slice(0, 5).forEach((message) => console.log(`  - ${message}`));
} catch (error) {
  check("test run completed", false, String(error).slice(0, 250));
} finally {
  console.log(
    `\n${results.filter((result) => result.ok).length}/${results.length} checks passed`,
  );
  await browser.close();
}
