import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { AdminContext } from "@/lib/permissions";

async function clientIp() {
  try {
    const store = await headers();
    return (
      store.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      store.get("x-real-ip") ??
      null
    );
  } catch {
    return null;
  }
}

/** Records an administrative action in the audit trail. */
export async function audit(options: {
  actor: AdminContext | { id: string; name: string; role: string };
  action: string;
  entity?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: options.actor.id,
        actorName: options.actor.name,
        actorRole: options.actor.role,
        action: options.action,
        entity: options.entity ?? null,
        entityId: options.entityId ?? null,
        meta: JSON.stringify(options.meta ?? {}),
        ip: await clientIp(),
      },
    });
  } catch (error) {
    // Auditing must never break the action it is recording.
    console.error("audit log failed", error);
  }
}
