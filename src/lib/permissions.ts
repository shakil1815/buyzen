import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * Role based access control.
 *
 * Permissions are plain strings checked **on the server** for every admin page
 * and every server action. The UI only hides what the server already refuses.
 */
export const PERMISSIONS = {
  "dashboard.view": "View the admin dashboard",
  "analytics.view": "View sales analytics and charts",
  "customers.view": "View the customer directory",
  "customers.viewSensitive": "View customer contact and location data",
  "customers.manage": "Edit customers, block and unblock accounts",
  "customers.export": "Export customer data",
  "locations.view": "View location analytics and the district map",
  "orders.view": "View orders",
  "orders.manage": "Change order status, courier and tracking",
  "orders.cancel": "Cancel orders",
  "orders.invoice": "Print invoices",
  "payments.view": "View payments",
  "payments.verify": "Approve or reject manual payments",
  "payments.refund": "Process refunds",
  "products.view": "View products",
  "products.manage": "Create and edit products",
  "products.delete": "Delete products",
  "inventory.manage": "Manage stock and thresholds",
  "products.import": "Import and export products",
  "reviews.moderate": "Approve, reject and report reviews",
  "marketing.manage": "Manage coupons, banners and flash sales",
  "cms.manage": "Manage website content and settings",
  "support.manage": "Manage support tickets",
  "reports.view": "View and export reports",
  "notifications.view": "View the admin notification centre",
  "settings.manage": "Manage system settings and security",
  "roles.manage": "Manage admin roles and permissions",
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ROLE_SLUGS = [
  "SUPER_ADMIN",
  "ADMIN",
  "ORDER_MANAGER",
  "PRODUCT_MANAGER",
  "SUPPORT",
  "MARKETING_MANAGER",
] as const;

export type RoleSlug = (typeof ROLE_SLUGS)[number];

const ALL: Permission[] = Object.keys(PERMISSIONS) as Permission[];

export const ROLE_PERMISSIONS: Record<RoleSlug, Permission[]> = {
  SUPER_ADMIN: ALL,
  ADMIN: ALL.filter(
    (permission) =>
      !["roles.manage", "settings.manage"].includes(permission),
  ),
  ORDER_MANAGER: [
    "dashboard.view",
    "orders.view",
    "orders.manage",
    "orders.cancel",
    "orders.invoice",
    "payments.view",
    "payments.verify",
    "payments.refund",
    "customers.view",
    "products.view",
    "reports.view",
    "notifications.view",
  ],
  PRODUCT_MANAGER: [
    "dashboard.view",
    "products.view",
    "products.manage",
    "products.delete",
    "inventory.manage",
    "products.import",
    "reviews.moderate",
    "orders.view",
    "reports.view",
    "notifications.view",
  ],
  SUPPORT: [
    "dashboard.view",
    "support.manage",
    "orders.view",
    "customers.view",
    "reviews.moderate",
    "notifications.view",
  ],
  MARKETING_MANAGER: [
    "dashboard.view",
    "marketing.manage",
    "cms.manage",
    "customers.view",
    "customers.export",
    "analytics.view",
    "reports.view",
    "notifications.view",
  ],
};

export const ROLE_LABELS: Record<RoleSlug, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  ORDER_MANAGER: "Order Manager",
  PRODUCT_MANAGER: "Product Manager",
  SUPPORT: "Customer Support",
  MARKETING_MANAGER: "Marketing Manager",
};

export function isAdminRole(value: string | undefined | null): value is RoleSlug {
  return !!value && (ROLE_SLUGS as readonly string[]).includes(value);
}

export function permissionsForRole(role: string | undefined | null): Permission[] {
  return isAdminRole(role) ? ROLE_PERMISSIONS[role] : [];
}

export function roleHasPermission(
  role: string | undefined | null,
  permission: Permission,
) {
  return permissionsForRole(role).includes(permission);
}

export type AdminContext = {
  id: string;
  name: string;
  email: string;
  role: RoleSlug;
  permissions: Permission[];
};

/** Loads the signed-in admin and their permissions (server side only). */
export async function getAdminContext(): Promise<AdminContext | null> {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return null;
  return {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
    permissions: ROLE_PERMISSIONS[session.role],
  };
}

/**
 * Server-side guard. Redirects to the login page when the visitor is not an
 * admin and back to the dashboard when the role lacks the permission.
 */
export async function requirePermission(
  permission: Permission,
): Promise<AdminContext> {
  const context = await getAdminContext();
  if (!context) redirect("/login?next=/admin");
  if (!context.permissions.includes(permission)) {
    redirect("/admin?denied=1");
  }
  return context;
}

/** Guard for server actions - throws instead of redirecting. */
export async function assertPermission(permission: Permission) {
  const context = await getAdminContext();
  if (!context) throw new Error("Forbidden: admin session required");
  if (!context.permissions.includes(permission)) {
    throw new Error(`Forbidden: ${permission} is required`);
  }
  return context;
}

/** Keeps the AdminRole table in sync with the code-defined permissions. */
export async function syncRoles() {
  for (const slug of ROLE_SLUGS) {
    await prisma.adminRole.upsert({
      where: { slug },
      update: {
        name: ROLE_LABELS[slug],
        permissions: JSON.stringify(ROLE_PERMISSIONS[slug]),
      },
      create: {
        slug,
        name: ROLE_LABELS[slug],
        permissions: JSON.stringify(ROLE_PERMISSIONS[slug]),
        description: `Built-in ${ROLE_LABELS[slug]} role`,
        isSystem: true,
      },
    });
  }
}
