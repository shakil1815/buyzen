import { requirePermission } from "@/lib/permissions";
import {
  PERMISSIONS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  ROLE_SLUGS,
  type Permission,
} from "@/lib/permissions";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Roles & permissions" };

export default async function AdminRolesPage() {
  await requirePermission("roles.manage");

  const all = Object.keys(PERMISSIONS) as Permission[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & permissions"
        description="Access is enforced on the server for every page and action."
      />

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-xs">
            <thead className="border-b border-line text-[10px] uppercase tracking-wide text-fg-subtle">
              <tr>
                <th className="px-2 py-2 font-semibold">Permission</th>
                {ROLE_SLUGS.map((role) => (
                  <th key={role} className="px-2 py-2 text-center font-semibold">
                    {ROLE_LABELS[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {all.map((permission) => (
                <tr key={permission}>
                  <td className="px-2 py-2">
                    <span className="font-mono text-[11px] text-fg">
                      {permission}
                    </span>
                    <span className="block text-[10px] text-fg-subtle">
                      {PERMISSIONS[permission]}
                    </span>
                  </td>
                  {ROLE_SLUGS.map((role) => (
                    <td key={role} className="px-2 py-2 text-center">
                      {ROLE_PERMISSIONS[role].includes(permission) ? (
                        <span className="inline-block h-2 w-2 rounded-full bg-success-fg" />
                      ) : (
                        <span className="inline-block h-2 w-2 rounded-full bg-surface-3" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="How enforcement works">
        <ul className="space-y-2 text-sm text-fg-muted">
          <li>
            Every admin page calls{" "}
            <code className="font-mono text-xs text-fg">
              requirePermission()
            </code>{" "}
            before it renders; unauthenticated visitors are redirected to the
            login page and unprivileged roles are rejected.
          </li>
          <li>
            Every server action calls{" "}
            <code className="font-mono text-xs text-fg">assertPermission()</code>{" "}
            before it touches the database, so hiding a button in the UI is never
            the only protection.
          </li>
          <li>
            The navigation only renders items the current role can use, which
            keeps the console tidy without being a security boundary.
          </li>
          <li>
            Role definitions live in{" "}
            <code className="font-mono text-xs text-fg">src/lib/permissions.ts</code>{" "}
            and are mirrored into the{" "}
            <code className="font-mono text-xs text-fg">AdminRole</code> table so
            they can be audited and extended.
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {ROLE_SLUGS.map((role) => (
            <StatusBadge key={role} tone="blue">
              {ROLE_LABELS[role]}
            </StatusBadge>
          ))}
        </div>
      </Panel>
    </div>
  );
}
