"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/guards";
import { writeAuditLog } from "@/lib/audit";

export type ActionState = { error?: string; success?: string } | undefined;

const branchSchema = z.object({
  name: z.string().min(1, "Branch name is required."),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  openingDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function createBranchAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUserSession();
  const parsed = branchSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const branch = await prisma.branch.create({
    data: {
      tenantId: session.tenantId,
      name: parsed.data.name,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      openingDate: parsed.data.openingDate ? new Date(parsed.data.openingDate) : null,
      notes: parsed.data.notes || null,
    },
  });

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "BRANCH_CREATED",
    entityType: "Branch",
    entityId: branch.id,
  });

  revalidatePath("/branches");
  return { success: "Branch added." };
}

export async function updateBranchAction(branchId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUserSession();
  const parsed = branchSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  // Tenant-scoped update: matching on {id, tenantId} together means a
  // cross-tenant id simply matches zero rows instead of leaking a 404 vs 403 signal.
  const result = await prisma.branch.updateMany({
    where: { id: branchId, tenantId: session.tenantId },
    data: {
      name: parsed.data.name,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      openingDate: parsed.data.openingDate ? new Date(parsed.data.openingDate) : null,
      notes: parsed.data.notes || null,
    },
  });
  if (result.count === 0) return { error: "Branch not found." };

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "BRANCH_UPDATED",
    entityType: "Branch",
    entityId: branchId,
  });

  revalidatePath("/branches");
  return { success: "Branch updated." };
}

export async function setBranchStatusAction(branchId: string, status: "ACTIVE" | "INACTIVE") {
  const session = await requireUserSession();
  const result = await prisma.branch.updateMany({
    where: { id: branchId, tenantId: session.tenantId },
    data: { status },
  });
  if (result.count === 0) return;

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "BRANCH_DEACTIVATED",
    entityType: "Branch",
    entityId: branchId,
    metadata: { status },
  });

  revalidatePath("/branches");
}
