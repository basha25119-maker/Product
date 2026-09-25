"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/guards";
import { writeAuditLog } from "@/lib/audit";
import { assertBranchOwnedByTenant } from "@/lib/ownership";

export type ActionState = { error?: string; success?: string } | undefined;

const rentSchema = z.object({
  branchId: z.string().min(1, "Branch is required."),
  date: z.string().min(1, "Date is required."),
  amount: z.string().min(1, "Amount is required."),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  notes: z.string().optional(),
});

export async function createRentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUserSession();
  const parsed = rentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const amount = parseFloat(parsed.data.amount);
  if (isNaN(amount) || amount <= 0) return { error: "Enter a valid amount." };

  try {
    await assertBranchOwnedByTenant(parsed.data.branchId, session.tenantId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid branch." };
  }

  const rent = await prisma.rentPayment.create({
    data: {
      tenantId: session.tenantId,
      branchId: parsed.data.branchId,
      date: new Date(parsed.data.date),
      amount,
      periodStart: parsed.data.periodStart ? new Date(parsed.data.periodStart) : null,
      periodEnd: parsed.data.periodEnd ? new Date(parsed.data.periodEnd) : null,
      notes: parsed.data.notes || null,
    },
  });

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "RENT_CREATED",
    entityType: "RentPayment",
    entityId: rent.id,
    metadata: { amount },
  });

  revalidatePath("/rent");
  revalidatePath("/dashboard");
  return { success: "Rent payment recorded." };
}

export async function deleteRentAction(rentId: string) {
  const session = await requireUserSession();
  const result = await prisma.rentPayment.updateMany({
    where: { id: rentId, tenantId: session.tenantId, deletedAt: null },
    data: { deletedAt: new Date(), deletedBy: session.userId },
  });
  if (result.count === 0) return;

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "EXPENSE_DELETED",
    entityType: "RentPayment",
    entityId: rentId,
  });

  revalidatePath("/rent");
  revalidatePath("/dashboard");
}
