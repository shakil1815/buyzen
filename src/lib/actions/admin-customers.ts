"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertPermission } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

const customerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(120),
  phone: z.string().max(40).optional(),
  city: z.string().max(80).optional(),
  district: z.string().max(80).optional(),
  division: z.string().max(80).optional(),
  postalCode: z.string().max(20).optional(),
  addressLine: z.string().max(240).optional(),
});

export type CustomerActionState = { error?: string; success?: string };

export async function updateCustomerAction(
  _state: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const admin = await assertPermission("customers.manage");

  const parsed = customerSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    city: formData.get("city") ?? "",
    district: formData.get("district") ?? "",
    division: formData.get("division") ?? "",
    postalCode: formData.get("postalCode") ?? "",
    addressLine: formData.get("addressLine") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid customer data" };
  }

  const data = parsed.data;
  const existing = await prisma.user.findUnique({
    where: { id: data.id },
    select: { id: true, name: true, email: true },
  });
  if (!existing) return { error: "Customer not found" };

  await prisma.user.update({
    where: { id: data.id },
    data: {
      name: data.name,
      phone: data.phone || null,
      city: data.city || null,
      district: data.district || null,
      division: data.division || null,
      postalCode: data.postalCode || null,
      addressLine: data.addressLine || null,
    },
  });

  await audit({
    actor: admin,
    action: "customer.update",
    entity: "User",
    entityId: data.id,
    meta: { email: existing.email },
  });

  revalidatePath(`/admin/customers/${data.id}`);
  revalidatePath("/admin/customers");
  return { success: "Customer details saved." };
}

export async function setCustomerStatusAction(
  id: string,
  status: "ACTIVE" | "BLOCKED",
  reason?: string,
) {
  const admin = await assertPermission("customers.manage");

  const customer = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });
  if (!customer) return { ok: false, message: "Customer not found" };

  await prisma.user.update({
    where: { id },
    data: {
      status,
      blockReason: status === "BLOCKED" ? (reason ?? null) : null,
      blockedAt: status === "BLOCKED" ? new Date() : null,
    },
  });

  if (status === "BLOCKED") {
    await notify({
      type: "security.event",
      title: `Account blocked: ${customer.name}`,
      body: customer.email,
      link: `/admin/customers/${customer.id}`,
    });
  }

  await audit({
    actor: admin,
    action: `customer.${status === "BLOCKED" ? "block" : "unblock"}`,
    entity: "User",
    entityId: id,
    meta: { email: customer.email, reason: reason ?? null },
  });

  revalidatePath(`/admin/customers/${id}`);
  revalidatePath("/admin/customers");
  return { ok: true, message: status === "BLOCKED" ? "Account blocked" : "Account unblocked" };
}

/** Withdraws the saved location for a customer (consent removal). */
export async function withdrawLocationConsentAction(id: string) {
  const admin = await assertPermission("customers.manage");

  await prisma.user.update({
    where: { id },
    data: {
      locationConsent: false,
      latitude: null,
      longitude: null,
      locationUpdatedAt: null,
    },
  });

  await prisma.address.updateMany({
    where: { userId: id },
    data: { locationConsent: false, latitude: null, longitude: null },
  });

  await audit({
    actor: admin,
    action: "customer.location.withdrawn",
    entity: "User",
    entityId: id,
  });

  revalidatePath(`/admin/customers/${id}`);
  revalidatePath("/admin/locations");
  return { ok: true, message: "Saved location removed" };
}

export async function logCustomerActivityAction(
  id: string,
  type: string,
  body: string,
) {
  const admin = await assertPermission("customers.manage");

  await prisma.activityLog.create({
    data: { userId: id, type, meta: JSON.stringify({ body, by: admin.name }) },
  });

  await audit({
    actor: admin,
    action: "customer.note.add",
    entity: "User",
    entityId: id,
    meta: { type },
  });

  revalidatePath(`/admin/customers/${id}`);
  return { ok: true, message: "Note added" };
}
