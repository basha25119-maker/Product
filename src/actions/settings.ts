"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/guards";
import { writeAuditLog } from "@/lib/audit";

export type ActionState = { error?: string; success?: string } | undefined;

const businessSchema = z.object({
  name: z.string().min(1, "Business name is required."),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  currency: z.string().min(1),
  timezone: z.string().min(1),
});

export async function updateBusinessProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUserSession();
  const parsed = businessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: {
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      currency: parsed.data.currency,
      timezone: parsed.data.timezone,
    },
  });

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "BUSINESS_UPDATED",
    entityType: "Tenant",
    entityId: session.tenantId,
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: "Business details updated." };
}

const paymentMethodSchema = z.object({ name: z.string().min(1, "Name is required.") });

export async function createPaymentMethodAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUserSession();
  const parsed = paymentMethodSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await prisma.paymentMethod.create({
    data: { tenantId: session.tenantId, name: parsed.data.name },
  });

  revalidatePath("/settings");
  return { success: "Payment method added." };
}

export async function togglePaymentMethodAction(paymentMethodId: string, isActive: boolean) {
  const session = await requireUserSession();
  await prisma.paymentMethod.updateMany({
    where: { id: paymentMethodId, tenantId: session.tenantId },
    data: { isActive },
  });
  revalidatePath("/settings");
}
