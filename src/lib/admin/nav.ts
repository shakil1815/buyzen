import type { Permission } from "@/lib/permissions";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: string;
  permission: Permission;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

/**
 * Admin navigation. Each entry declares the permission required to see it -
 * the server re-checks the same permission on the page itself, so hiding an
 * item is only ever a convenience.
 */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: "gauge",
        permission: "dashboard.view",
      },
      {
        href: "/admin/reports",
        label: "Reports & exports",
        icon: "chart",
        permission: "reports.view",
      },
    ],
  },
  {
    label: "Customers",
    items: [
      {
        href: "/admin/customers",
        label: "Customers",
        icon: "users",
        permission: "customers.view",
      },
      {
        href: "/admin/segments",
        label: "Segments",
        icon: "layers",
        permission: "customers.view",
      },
      {
        href: "/admin/locations",
        label: "Location analytics",
        icon: "map",
        permission: "locations.view",
      },
      {
        href: "/admin/support",
        label: "Support tickets",
        icon: "ticket",
        permission: "support.manage",
      },
    ],
  },
  {
    label: "Sales",
    items: [
      {
        href: "/admin/orders",
        label: "Orders",
        icon: "package",
        permission: "orders.view",
      },
      {
        href: "/admin/payments",
        label: "Payments",
        icon: "card",
        permission: "payments.view",
      },
      {
        href: "/admin/refunds",
        label: "Returns & refunds",
        icon: "rotate",
        permission: "payments.view",
      },
    ],
  },
  {
    label: "Catalogue",
    items: [
      {
        href: "/admin/products",
        label: "Products",
        icon: "box",
        permission: "products.view",
      },
      {
        href: "/admin/inventory",
        label: "Inventory",
        icon: "warehouse",
        permission: "inventory.manage",
      },
      {
        href: "/admin/reviews",
        label: "Reviews",
        icon: "star",
        permission: "reviews.moderate",
      },
    ],
  },
  {
    label: "Growth",
    items: [
      {
        href: "/admin/marketing",
        label: "Marketing",
        icon: "megaphone",
        permission: "marketing.manage",
      },
      {
        href: "/admin/coupons",
        label: "Coupons",
        icon: "coupon",
        permission: "marketing.manage",
      },
      {
        href: "/admin/content",
        label: "Content & CMS",
        icon: "layout",
        permission: "cms.manage",
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        href: "/admin/notifications",
        label: "Notifications",
        icon: "bell",
        permission: "notifications.view",
      },
      {
        href: "/admin/roles",
        label: "Roles & permissions",
        icon: "shield",
        permission: "roles.manage",
      },
      {
        href: "/admin/settings",
        label: "Settings & security",
        icon: "settings",
        permission: "settings.manage",
      },
    ],
  },
];

export const ADMIN_ICONS: Record<string, string> = {
  gauge: "M12 14a2 2 0 100-4 2 2 0 000 4zm0-10a7 7 0 00-7 7h2a5 5 0 019-5 5 5 0 010-9 5 5 0 01-7 7z",
  chart: "M4 19h16M7 16V9m5 7V5m5 11v-4",
  users:
    "M16 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2m9-10a4 4 0 100-8 4 4 0 000 8zm7-3a3 3 0 11-6 0 3 3 0 016 0z",
  layers: "M12 3l9 5-9 5-9-5 9-5zm9 10l-9 5-9-5m18 5l-9 5-9-5",
  map: "M9 20l-5-2V6l5 2m0 12l6-2m-6 2V8m6 10l5-2V8l-5 2m0 10V6m0 14l6-2",
  ticket:
    "M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v3a2 2 0 010 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 010-4V7a2 2 0 012-2z",
  package:
    "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  card: "M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z",
  rotate: "M4 4v6h6M20 20v-6h-6M20 9a8 8 0 00-14.3-3M4 15a8 8 0 0014.3 3",
  box: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  warehouse:
    "M3 21V9l9-6 9 6v12M7 21v-8h10v8M7 17h10",
  star: "M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9L6.6 19l1-6.1L3.2 9.4l6.1-.9L12 3z",
  megaphone:
    "M3 11v2a1 1 0 001 1h3l6 4V6L7 10H4a1 1 0 00-1 1zm11-2a5 5 0 010 6m3-9a9 9 0 010 12",
  layout: "M4 4h16v16H4zM4 10h16M10 10v10",
  download: "M12 3v12m0 0l-4-4m4 4l4-4M4 21h16",
  bell: "M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8M10.3 21a2 2 0 003.4 0",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z",
  settings:
    "M12 15a3 3 0 100-6 3 3 0 000 6zm8-3a8 8 0 01-.1 1.2l2 1.6-2 3.4-2.4-1a8 8 0 01-2 1.2l-.4 2.6h-4l-.4-2.6a8 8 0 01-2-1.2l-2.4 1-2-3.4 2-1.6A8 8 0 014 12a8 8 0 01.1-1.2l-2-1.6 2-3.4 2.4 1a8 8 0 012-1.2l.4-2.6h4l.4 2.6a8 8 0 012 1.2l2.4-1 2 3.4-2 1.6A8 8 0 0120 12z",
  coupon: "M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4V8zm7 3h4",
};
