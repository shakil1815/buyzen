/**
 * End-to-end smoke test of the main shopping journey.
 *
 *   node scripts/e2e.mjs
 *
 * It drives a real browser (Microsoft Edge) against the dev server:
 * browse -> add to cart -> apply promo code -> checkout -> order created.
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
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

try {
  // 1. Home page -------------------------------------------------------
  await page.goto(BASE, { waitUntil: "networkidle" });
  check("home renders hero", await page.locator("h1").first().isVisible());
  check(
    "home shows product cards",
    (await page.locator("article").count()) > 0,
    `${await page.locator("article").count()} cards`,
  );

  // 2. Catalogue + filters --------------------------------------------
  await page.goto(`${BASE}/products?category=gaming`, { waitUntil: "networkidle" });
  const gamingCards = await page.locator("article").count();
  check("category filter returns gaming products", gamingCards > 0, `${gamingCards} cards`);

  // 3. Product detail + add to cart ------------------------------------
  await page.goto(`${BASE}/products/arcade-pro-controller`, {
    waitUntil: "networkidle",
  });
  check(
    "product page shows price",
    await page.getByText("$69").first().isVisible(),
  );

  await page.getByRole("button", { name: /^Add to cart$/i }).first().click();
  await page.waitForTimeout(1500);
  await page.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
  const cartHasItem = await page.getByText("Arcade Pro Controller").first().isVisible();
  check("item added to cart", cartHasItem);

  // 4. Promo code -------------------------------------------------------
  await page.getByPlaceholder("Promo code").fill("WELCOME10");
  await page.getByRole("button", { name: "Apply" }).click();
  await page.waitForTimeout(1500);
  await page.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
  const discountShown = await page.getByText("Discount").first().isVisible();
  check("promo code applies discount", discountShown);

  // 5. Checkout ---------------------------------------------------------
  await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
  await page.fill("#email", "e2e@example.com");
  await page.fill("#shippingName", "Evan Tester");
  await page.fill("#address1", "42 Test Street");
  await page.fill("#city", "Rotterdam");
  await page.fill("#postalCode", "3011AA");
  await page.fill("#cardNumber", "4242424242424242");
  await page.fill("#expiry", "12/30");
  await page.fill("#cvc", "123");
  await page.getByRole("button", { name: /^Pay \$/ }).click();
  await page.waitForURL(/checkout\/success/, { timeout: 20000 });
  check("order placed", page.url().includes("/checkout/success"), page.url());
  check(
    "confirmation shows order number",
    await page.getByText(/BZ-[A-Z0-9]+-\d+/).first().isVisible(),
  );

  // 6. Sign in ----------------------------------------------------------
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", "admin@buyzen.com");
  await page.fill("#password", "admin12345");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin/, { timeout: 20000 });
  check("admin can sign in", page.url().includes("/admin"));

  await page.goto(`${BASE}/admin/products`, { waitUntil: "networkidle" });
  check(
    "admin product table renders",
    (await page.locator("table tbody tr").count()) > 0,
  );

  // 7. Chat assistant ---------------------------------------------------
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Ask the assistant/i }).click();
  await page.fill("#chat-input", "show me gaming controllers");
  await page.getByRole("button", { name: "Send message" }).click();
  await page.waitForTimeout(2500);
  const chatText = await page.locator("text=Here's what I found").first().isVisible();
  check("AI assistant answers", chatText);
} catch (error) {
  check("test run completed", false, String(error).slice(0, 200));
} finally {
  const realErrors = errors.filter(
    (message) => !message.includes("favicon") && !message.includes("Download the React DevTools"),
  );
  console.log(`\nconsole errors: ${realErrors.length}`);
  realErrors.slice(0, 5).forEach((message) => console.log(`  - ${message}`));
  console.log(
    `\n${results.filter((result) => result.ok).length}/${results.length} checks passed`,
  );
  await browser.close();
}
