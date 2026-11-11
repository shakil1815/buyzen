# ShopFront — a complete e-commerce storefront

A production-shaped demo store built with **Next.js 16 (App Router)**, **TypeScript**,
**Tailwind CSS v4**, **Prisma + SQLite**, and server actions for every mutation.
It includes the full shopping journey (browse → search → cart → promo code →
checkout → order), customer accounts, an admin back office, marketing extras, and a
catalog-aware AI shopping assistant.

**Built for a Bangladesh audience out of the box:** full **বাংলা (Bangla)** interface,
**BDT (৳ Taka)** pricing alongside USD, and a **Light / Dark / Default( System)** theme
switcher — all switchable from the header without a page reload.

```
C:\Users\shaki\ecommerce-store
```

---

## Quick start

```bash
npm install          # install dependencies
npm run setup        # run migrations + generate Prisma client + seed the demo data
npm run dev          # http://localhost:3000
```

`npm run setup` creates `prisma/dev.db`, generates the Prisma client and seeds
32 products across 6 categories (with generated SVG product artwork), demo users,
reviews and coupon codes.

### Demo accounts

| Role     | Email                   | Password     |
| -------- | ----------------------- | ------------ |
| Admin    | `admin@shopfront.dev`   | `admin12345` |
| Customer | `customer@example.com`  | `customer123`|

### Useful scripts

| Command                | What it does                                              |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Dev server (Turbopack)                                     |
| `npm run build`        | Production build                                           |
| `npm run start`        | Serve the production build                                 |
| `npm run verify`       | typecheck → lint → build                                   |
| `npm run typecheck`    | `tsc --noEmit`                                             |
| `npm run lint`         | ESLint (flat config)                                       |
| `npm run db:seed`      | Re-seed the database                                       |
| `npm run db:migrate`   | Create/apply a Prisma migration                            |
| `npm run db:studio`    | Prisma Studio (browse the data)                            |
| `npm run e2e`          | Browser test of the shopping journey                       |
| `npm run e2e:account`  | Browser test of the account journey                        |
| `npm run e2e:admin`    | Browser test of the admin CRUD flow                        |
| `npm run e2e:i18n`     | Browser test of language, currency and theme switching     |
| `npm run screenshots`  | Save screenshots of the main pages to `screenshots/`       |

---

## Feature tour

### Bangladesh localisation (Bangla + Taka)
- **বাংলা (Bangla) interface** — every page, component and form is translated
  (catalogue, product pages, cart, checkout, account area, admin back office, help
  centre, emails/messages). Product *names* stay in English, the way real
  Bangladeshi stores list imported electronics.
- **BDT (৳ Taka)** — switch the currency from the header and every price, cart
  total, invoice line and AI reply converts to Taka using the lakh-style grouping
  used in Bangladesh (`৳33,480`). Prices are stored in USD cents and converted for
  display, so the catalogue stays currency-agnostic.
- **Bangla AI assistant** — the chat widget replies in Bangla (including product
  searches in Banglish) and quotes prices in ৳.
- **Checkout** — Bangladesh is the default country, with all other markets one
  click away.

### Theme switcher (Light / Dark / Default)
- Three modes in the header settings panel: **Light**, **Dark** and
  **Default (System)** which follows the operating system preference.
- Implemented with semantic design tokens (`--surface`, `--fg`, `--line`,
  `--brand-soft`, success/warn/danger tokens) that flip at runtime, so every card,
  table, badge, input and shadow re-themes automatically.
- The choice is stored in a cookie and applied by an inline script **before first
  paint**, so there is no flash of the wrong theme.

### Storefront
- **Home** — hero, category grid, featured products, today's deals, highest rated
  and new arrivals.
- **Catalogue** (`/products`) — full-text search, category pills, price range,
  minimum rating, in-stock / on-sale toggles and six sort orders, all driven by
  URL search params so results are shareable and shareable-back-button friendly.
- **Product detail** — gallery, price with compare-at pricing, stock state,
  quantity picker, wishlist, ratings breakdown, written reviews, JSON-LD product
  schema and related products.
- **Cart** — server-side cart persisted in SQLite and keyed by an httpOnly cookie,
  quantity editing, removal, promo codes, live shipping/tax/total calculation.
- **Checkout** — contact + shipping + payment form, Luhn card validation, order
  creation in a transaction, stock decrement, coupon usage counters, confirmation
  page with order summary.
- **Help centre** (`/help`) — shipping, returns, warranty, FAQ and contact pages.

### Accounts
- Register / sign in with bcrypt-hashed passwords and a signed JWT session cookie
  (`jose`, httpOnly, sameSite=lax, 30-day expiry).
- Account dashboard with lifetime spend, order count and saved items.
- Order history with live status and per-order totals.
- Wishlist (heart toggle on every product card).

### Marketing extras
- **Promo codes** — percentage or fixed value, minimum order, usage limits and
  expiry. Seeded codes: `WELCOME10`, `SAVE20`, `TECHDEAL`, `FLAT25`.
- **Reviews & ratings** — one review per customer per product, live average score.
- **Wishlist** — saved products, synced to the account.
- **Newsletter** — footer signup stored in the `Subscriber` table.
- **Free-shipping progress** and discount/compare-at pricing surfaced throughout.

### Admin back office (`/admin`)
- Dashboard: revenue, orders, products, customers, recent orders, low-stock alerts.
- Product CRUD (create, edit, delete, feature toggles, stock management).
- Order management with inline status transitions.
- Coupon management (create, enable/disable).
- Customer list with lifetime value.

### AI shopping assistant
- Floating chat widget on every page (`/api/chat`).
- **Works out of the box** with a built-in, catalog-aware engine: intent detection
  (greetings, shipping, returns, payments, promos, order tracking, contact),
  keyword + budget-aware product search and product cards in the reply.
- **Upgrades itself** when `OPENAI_API_KEY` is set: the catalogue is injected as
  context into a hosted model (`gpt-4o-mini` by default) with the same response
  contract, so the UI never changes.

---

## Architecture

```
prisma/
  schema.prisma        # users, products, categories, carts, orders, reviews,
                       # coupons, wishlist, subscribers
  seed.mts             # demo data + generated SVG artwork in public/products
src/
  app/                 # App Router pages, layouts, route handlers
    api/chat           # AI assistant endpoint (locale + currency aware)
    api/search         # header search suggestions
    api/webhooks/stripe# Stripe webhook (marks orders paid)
  components/          # UI components (server + client)
  lib/
    cart.ts            # cart persistence, totals, shipping/tax rules
    session.ts         # JWT session cookie helpers
    chatbot.ts         # assistant engine (local + OpenAI, EN + BN)
    currency.ts        # USD/BDT conversion helpers
    i18n/              # dictionaries (en/bn), server helpers, interpolation
    settings.ts        # locale / currency / theme cookie helpers
    actions/           # server actions (auth, cart, checkout, reviews, admin, settings)
scripts/               # playwright smoke tests + screenshot tools
```

**Money** is stored in integer cents (USD) everywhere; formatting and the
USD → BDT conversion happen only at the edge (`src/lib/format.ts`).

**Localisation** uses a typed dictionary (`src/lib/i18n/dictionaries.ts`) where the
Bangla file is checked against the English keys at compile time, so a missing
translation fails the build. Server components read it with `getT()`, client
components with `useI18n()`.

**Themes** are driven by semantic CSS variables in `src/app/globals.css`; the
palette flips through a `.dark` class on `<html>`.

**Mutations** all go through server actions (`"use server"`), so validation happens
server-side with Zod and the UI stays thin.

**Session & cart cookies** are httpOnly and `sameSite=lax`; the cart survives a
sign-in and is reused across devices for signed-in shoppers.

---

## Configuration

Copy `.env.example` to `.env` and adjust:

| Variable                    | Required | Purpose                                                     |
| --------------------------- | -------- | ----------------------------------------------------------- |
| `DATABASE_URL`              | yes      | SQLite file (`file:./dev.db`) or a hosted Postgres URL      |
| `AUTH_SECRET`               | yes      | Secret used to sign session cookies                          |
| `NEXT_PUBLIC_SITE_URL`      | no       | Canonical URL for metadata, sitemap and Stripe redirects     |
| `USD_TO_BDT_RATE`           | no       | Taka rate for USD prices (default `120`)                    |
| `OPENAI_API_KEY`            | no       | Enables the hosted AI assistant (falls back to the local one)|
| `OPENAI_MODEL`              | no       | Model id, defaults to `gpt-4o-mini`                          |
| `STRIPE_SECRET_KEY`         | no       | Enables Stripe Checkout instead of the built-in card form    |
| `STRIPE_WEBHOOK_SECRET`     | no       | Verifies `/api/webhooks/stripe` payloads                     |

The locale (`sf_locale`), currency (`sf_currency`) and theme (`sf_theme`) are stored
in first-party cookies and can be changed from the header settings panel.

### Payments
The built-in checkout validates card numbers with a Luhn check and expiry/CVC
rules, then creates the order — no real charge is made (`4242 4242 4242 4242` works
with any future expiry).

To use real Stripe Checkout instead, set `STRIPE_SECRET_KEY` (plus
`STRIPE_WEBHOOK_SECRET` for the webhook at `/api/webhooks/stripe`): the checkout
page then renders a *Pay with Stripe* button that creates a Checkout Session with
your line items, discount, shipping and tax, and the webhook flips the order to
`PAID`.

### Switching to PostgreSQL
Change the datasource in `prisma/schema.prisma` to `postgresql`, point
`DATABASE_URL` at your instance and run `npx prisma migrate dev`. The data model
uses no SQLite-specific features.

---

## Testing

The `scripts/e2e*.mjs` files drive a real browser (Microsoft Edge via
`playwright-core`, no browser download required) against the running dev server:

```bash
npm run dev          # in one terminal
npm run e2e          # browse → add to cart → promo code → checkout → admin
npm run e2e:account  # register → wishlist → review → order → history → newsletter
npm run e2e:admin    # sign in → create product → edit → delete → coupons/orders/customers
npm run e2e:i18n     # English/Bangla · USD/BDT · light/dark switching
```

All four suites currently pass **11/11**, **7/7**, **6/6** and **8/8** checks with
zero console errors.

---

## Deployment notes

- Set `AUTH_SECRET`, `DATABASE_URL` and `NEXT_PUBLIC_SITE_URL` in the host's
  environment, then `npm run build && npm run start`.
- `prisma/dev.db` is SQLite — for serverless deployments point `DATABASE_URL` at
  Postgres (or a hosted SQLite provider) and run `npm run setup` on release.
- `public/products/*.svg` are generated artwork; replace them with real product
  photography by updating the `image` column (and `gallery`, a JSON array) or by
  pointing them at a CDN and adding the host to `images.remotePatterns`.

## Notes & limitations

- SQLite is used for zero-setup local development; swap the datasource for
  Postgres in production.
- The built-in payment form is a simulation — no card data is stored or sent.
- Reviews are currently available to any signed-in customer rather than being
  restricted to verified purchasers (the UI copy notes the intent).
