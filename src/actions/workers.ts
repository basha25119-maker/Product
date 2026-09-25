"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/guards";
import { writeAuditLog } from "@/lib/audit";
import { assertBranchOwnedByTenant } from "@/lib/ownership";

export type ActionState = { error?: string; success?: string } | undefined;

const workerSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  displayName: z.string().optional(),
  branchId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  startDate: z.string().optional(),
  wageType: z.enum(["HOURLY", "DAILY", "WEEKLY", "MONTHLY", "COMMISSION"]),
  defaultWageAmount: z.string().optional(),
  notes: z.string().optional(),
});

export async function createWorkerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUserSession();
  const parsed = workerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  if (parsed.data.branchId) {
    try {
      await assertBranchOwnedByTenant(parsed.data.branchId, session.tenantId);
    } catch {
      return { error: "Selected branch is invalid." };
    }
  }

  const worker = await prisma.worker.create({
    data: {
      tenantId: session.tenantId,
      branchId: parsed.data.branchId || null,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      displayName: parsed.data.displayName || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      wageType: parsed.data.wageType,
      defaultWageAmount: parsed.data.defaultWageAmount ? parsed.data.defaultWageAmount : null,
      notes: parsed.data.notes || null,
    },
  });

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "WORKER_CREATED",
    entityType: "Worker",
    entityId: worker.id,
  });

  revalidatePath("/workers");
  return { success: "Worker added." };
}

export async function updateWorkerAction(workerId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUserSession();
  const parsed = workerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  if (parsed.data.branchId) {
    try {
      await assertBranchOwnedByTenant(parsed.data.branchId, session.tenantId);
    } catch {
      return { error: "Selected branch is invalid." };
    }
  }

  const result = await prisma.worker.updateMany({
    where: { id: workerId, tenantId: session.tenantId },
    data: {
      branchId: parsed.data.branchId || null,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      displayName: parsed.data.displayName || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      wageType: parsed.data.wageType,
      defaultWageAmount: parsed.data.defaultWageAmount ? parsed.data.defaultWageAmount : null,
      notes: parsed.data.notes || null,
    },
  });
  if (result.count === 0) return { error: "Worker not found." };

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "WORKER_UPDATED",
    entityType: "Worker",
    entityId: workerId,
  });

  revalidatePath("/workers");
  return { success: "Worker updated." };
}

export async function setWorkerStatusAction(workerId: string, status: "ACTIVE" | "INACTIVE" | "LEFT") {
  const session = await requireUserSession();
  const result = await prisma.worker.updateMany({
    where: { id: workerId, tenantId: session.tenantId },
    data: { status, endDate: status === "LEFT" ? new Date() : undefined },
  });
  if (result.count === 0) return;

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "WORKER_DEACTIVATED",
    entityType: "Worker",
    entityId: workerId,
    metadata: { status },
  });

  revalidatePath("/workers");
}
