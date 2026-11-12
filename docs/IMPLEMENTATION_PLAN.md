# ShopFront — Admin Dashboard & Customer Management Implementation Plan

Status: **complete** · Last updated: Phase 14

This document records the audit, the phase-by-phase plan, and the running log of
what has been implemented, verified and deliberately left out.

> **Recovery note** — an earlier session was interrupted by a network outage.
> The work was recovered from the working tree, the one outstanding TypeScript
> error (`admin.ts` actions returning a value where a form action must return
> `void`) was fixed properly, and every suite was re-run before this document
> was finalised.

---

## Phase 1 — Existing project audit

### What already existed (reused, not rebuilt)

| Area | Implementation |
| ---- | -------------- |
| Stack | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind v4, Prisma 6 + SQLite |
| Storefront | Home, catalogue with search/filter/sort, product detail, cart, checkout, order confirmation, help centre, credits |
| Accounts | Register / login (bcrypt + signed JWT httpOnly cookie), account dashboard, order history, wishlist |
| Localisation | Typed `en` / `bn` dictionaries, cookie-driven locale, Bangla-first copy |
| Currency | USD / BDT display layer, lakh-style ৳ formatting, configurable rate |
| Theme | Light / Dark / Default(System) via semantic CSS tokens, cookie + pre-paint script |
| AI assistant | Local catalog engine (EN + BN) with optional OpenAI upgrade |
| Admin (before) | Simple dashboard, product CRUD, order list, coupons, customers list |
| Payments | Simulated card checkout with Luhn validation; optional Stripe path (not configured) |
| Tests | Playwright suites for shopping, account, admin and i18n |

### Gaps found against the brief

1. **No RBAC** — `User.role` was free text with two values.
2. **No audit trail** for administrative actions.
3. **No admin notification centre.**
4. **Flat order workflow** — no transitions, timeline, courier, tracking, cancels, returns.
5. **No payment ledger** — no manual bKash/Nagad/Rocket verification, COD tracking, refunds.
6. **Thin customer model** — no phone, avatar, status, address book, district/division, consent, activity.
7. **No segmentation, location analytics or map.**
8. **No variants, brands, thresholds, import/export.**
9. **Marketing limited to coupons** — no banners, flash sales, abandoned carts, campaigns.
10. **No CMS** — about/FAQ/privacy/terms pages were hard-coded.
11. **No support tickets, no review moderation.**
12. **No reports/exports, no system settings store.**
13. **Missing DB indexes** on every field admins filter by.

---

## Phase log

| Phase | Scope | Status | Verified by |
| ----- | ----- | ------ | ------------ |
| 1 | Audit + plan | ✅ | this document |
| 2 | Data model, RBAC, audit log, analytics engine, new dashboard | ✅ | `e2e-admin-platform` (dashboard, charts) |
| 3 | Customer Management (directory, profile, actions, export) | ✅ | `e2e-admin-platform` (directory, profile) |
| 4 | Customer segmentation + targeted campaigns | ✅ | `e2e-admin-platform` (segments) |
| 5 | Location analytics + interactive district map | ✅ | `e2e-admin-platform` (map, analytics) |
| 6 | Order Management (workflow, timeline, courier, cancel, invoice) | ✅ | `e2e-admin-platform` (order detail, transitions) |
| 7 | Payment Management (manual gateways, COD, verification, refunds) | ✅ | `e2e-admin-platform` (ledger) |
| 8 | Product & inventory (variants, brands, thresholds, import/export) | ✅ | `e2e-admin-platform` (inventory) + `e2e-admin` |
| 9 | Marketing + CMS | ✅ | `e2e-admin-platform` (coupon, CMS) |
| 10 | Customer support + review moderation | ✅ | `e2e-admin-platform` (tickets, reviews) |
| 11 | Roles & permissions UI + server-side enforcement | ✅ | `e2e-admin-platform` (matrix, RBAC block) |
| 12 | Reports, export centre, notification centre | ✅ | `e2e-admin-platform` (CSV export, notifications) |
| 13 | System settings, security, audit viewer, backup | ✅ | `e2e-admin-platform` (settings, audit log) |
| 14 | Tests, optimisation, documentation | ✅ | 5 Playwright suites + typecheck + lint + build |

---

## Data model changes (migration `20261112070224_admin_platform`)

- `User`: `phone`, `avatarUrl`, `status` (ACTIVE/BLOCKED), `blockReason`, `blockedAt`,
  `addressLine`, `city`, `district`, `division`, `country`, `postalCode`,
  `locationConsent`, `latitude`, `longitude`, `locationUpdatedAt`, `lastActiveAt`.
- `Address` — saved delivery addresses, kept separate from device geolocation.
- `AdminRole` — role definitions with a permission list.
- `Brand`, `Category.parentId` — brands and sub-categories.
- `Product`: `brandId`, `lowStockThreshold`, `cost`, `taxRate`, `sizes`, `colors`, `variants`.
- `Order`: `invoiceNumber`, `paymentStatus`, `courierName`, `courierPhone`,
  `trackingNumber`, `cancelReason`, `refundedAmount`, `confirmedAt`, `packedAt`,
  `shippedAt`, `deliveredAt`, `district`, `division`.
- `OrderEvent` (timeline) and `OrderStatusHistory` (transition audit).
- `Payment` (ledger) and `RefundRequest`.
- `Coupon`: `customerId`, `startsAt`, `endsAt`, `maxPerCustomer`.
- `Banner`, `FlashSale` — marketing.
- `PageContent` — CMS pages.
- `Setting` — key/value system settings.
- `SupportTicket`, `TicketMessage` — customer support.
- `Review`: `status` (PENDING/APPROVED/REJECTED), `reported`, `verifiedPurchase`, `adminNote`.
- `Notification`, `AuditLog`, `ActivityLog`.

Indexes were added for every field admins filter or sort by.

---

## Key files created

**Libraries** — `src/lib/permissions.ts`, `src/lib/audit.ts`, `src/lib/notifications.ts`,
`src/lib/bangladesh.ts`, `src/lib/csv.ts`, `src/lib/orders.ts`,
`src/lib/admin/{nav,analytics,customers,locations}.ts`,
`src/lib/actions/{admin-customers,admin-orders,admin-payments,admin-catalogue,admin-growth,admin-support,admin-segments}.ts`

**Components** — `src/components/admin/{ui,charts,admin-icon,customer-forms,order-actions,payment-actions,refund-actions,product-form,marketing-forms,content-forms,ticket-reply-form,review-actions,stock-controls,segment-campaign-form,segment-config-form,notification-actions,bangladesh-map,location-consent-button,security-settings}.tsx`

**Pages** — `/admin`, `/admin/customers`, `/admin/customers/[id]`, `/admin/segments`,
`/admin/locations`, `/admin/orders`, `/admin/orders/[id]`, `/admin/orders/[id]/invoice`,
`/admin/payments`, `/admin/refunds`, `/admin/inventory`, `/admin/marketing`,
`/admin/content`, `/admin/support`, `/admin/support/[id]`, `/admin/reviews`,
`/admin/roles`, `/admin/reports`, `/admin/notifications`, `/admin/settings`

**Route groups** — every storefront route lives in `src/app/(shop)` so the shop
header, footer and chat widget are not rendered inside the admin console, which
has its own shell (sticky header + grouped sidebar). The root layout owns only
`html`/`body`, the providers and the pre-paint theme script.

**API** — `/api/admin/export/[type]`, `/api/admin/backup`

---

## Verification

| Suite | Result |
| ----- | ------ |
| `npm run e2e` (shopping) | 11/11 |
| `npm run e2e:account` | 7/7 |
| `npm run e2e:admin` | 6/6 |
| `npm run e2e:i18n` | 8/8 |
| `npm run e2e:admin-platform` | 34/34 |
| `npm run typecheck` | clean |
| `npm run lint` | clean |
| `npm run build` | 45 routes (24 admin + storefront + API), no errors |

---

## Deliberate boundaries (documented, not faked)

- **No live payment gateway credentials.** bKash/Nagad/Rocket are implemented as
  *manual* payment flows exactly as specified; SSLCommerz and the official
  merchant APIs are scaffolded with an explicit "not configured" state and never
  report a successful transaction without admin verification.
- **No outbound email.** Ticket replies and notifications are written to the
  in-app admin notification centre and the support thread.
- **PDF export** is provided as print-optimised invoice/report views (browser
  "Save as PDF"); CSV export is a real downloadable file.
- **Location** is district-level aggregate on an interactive SVG map built from
  consented locations only. No continuous or hidden tracking, and customers can
  withdraw consent (which deletes the stored coordinates).
- **The admin console is English-only**; the storefront remains fully bilingual
  (English / বাংলা). Translating the console would double the size of the
  dictionary without changing any behaviour.
- **Loyalty points and referral rewards** are modelled as configuration rather
  than a points ledger; the marketing screen documents the configured values.
