"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/guards";
import { writeAuditLog } from "@/lib/audit";
import { assertBranchOwnedByTenant, assertWorkerOwnedByTenant, assertPaymentMethodOwnedByTenant } from "@/lib/ownership";

export type ActionState = { error?: string; success?: string } | undefined;

const wageSchema = z.object({
  branchId: z.string().min(1, "Branch is required."),
  workerId: z.string().min(1, "Worker is required."),
  date: z.string().min(1, "Date is required."),
  amount: z.string().min(1, "Amount is required."),
  paymentMethodId: z.string().optional(),
  payPeriodStart: z.string().optional(),
  payPeriodEnd: z.string().optional(),
  notes: z.string().optional(),
});

export async function createWageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUserSession();
  const parsed = wageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const amount = parseFloat(parsed.data.amount);
  if (isNaN(amount) || amount <= 0) return { error: "Enter a valid amount." };

  try {
    await assertBranchOwnedByTenant(parsed.data.branchId, session.tenantId);
    await assertWorkerOwnedByTenant(parsed.data.workerId, session.tenantId);
    if (parsed.data.paymentMethodId) {
      await assertPaymentMethodOwnedByTenant(parsed.data.paymentMethodId, session.tenantId);
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid selection." };
  }

  const wage = await prisma.wagePayment.create({
    data: {
      tenantId: session.tenantId,
      branchId: parsed.data.branchId,
      workerId: parsed.data.workerId,
      date: new Date(parsed.data.date),
      amount,
      paymentMethodId: parsed.data.paymentMethodId || null,
      payPeriodStart: parsed.data.payPeriodStart ? new Date(parsed.data.payPeriodStart) : null,
      payPeriodEnd: parsed.data.payPeriodEnd ? new Date(parsed.data.payPeriodEnd) : null,
      notes: parsed.data.notes || null,
    },
  });

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "WAGE_CREATED",
    entityType: "WagePayment",
    entityId: wage.id,
    metadata: { amount },
  });

  revalidatePath("/wages");
  revalidatePath("/dashboard");
  return { success: "Wage payment recorded." };
}

export async function deleteWageAction(wageId: string) {
  const session = await requireUserSession();
  const result = await prisma.wagePayment.updateMany({
    where: { id: wageId, tenantId: session.tenantId, deletedAt: null },
    data: { deletedAt: new Date(), deletedBy: session.userId },
  });
  if (result.count === 0) return;

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "WAGE_DELETED",
    entityType: "WagePayment",
    entityId: wageId,
  });

  revalidatePath("/wages");
  revalidatePath("/dashboard");
}
