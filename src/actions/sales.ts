"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/guards";
import { writeAuditLog } from "@/lib/audit";
import { assertBranchOwnedByTenant, assertWorkerOwnedByTenant } from "@/lib/ownership";

export type ActionState = { error?: string; success?: string } | undefined;

const entrySchema = z.object({
  branchId: z.string().min(1, "Branch is required."),
  workerId: z.string().min(1, "Worker is required."),
  date: z.string().min(1, "Date is required."),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const AMOUNT_PREFIX = "amount_";

/** Pulls every `amount_<paymentMethodId>` field out of the submitted form. */
function extractAmounts(formData: FormData): { paymentMethodId: string; amount: number }[] {
  const amounts: { paymentMethodId: string; amount: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith(AMOUNT_PREFIX)) continue;
    const paymentMethodId = key.slice(AMOUNT_PREFIX.length);
    const amount = parseFloat(String(value));
    if (!isNaN(amount) && amount > 0) {
      amounts.push({ paymentMethodId, amount });
    }
  }
  return amounts;
}

async function verifyRelations(tenantId: string, branchId: string, workerId: string, paymentMethodIds: string[]) {
  await assertBranchOwnedByTenant(branchId, tenantId);
  const worker = await assertWorkerOwnedByTenant(workerId, tenantId);
  if (worker.branchId && worker.branchId !== branchId) {
    throw new Error("Selected worker does not belong to the selected branch.");
  }
  const validMethods = await prisma.paymentMethod.count({
    where: { tenantId, id: { in: paymentMethodIds } },
  });
  if (validMethods !== paymentMethodIds.length) {
    throw new Error("One or more payment methods are invalid.");
  }
}

/**
 * Records one worker's sales for a single day in one submission: every
 * active payment method (Cash, Card/Machine, plus any custom ones) gets its
 * own amount field, and each non-zero amount becomes its own Sale row
 * sharing the same date/branch/worker — so the owner enters once instead of
 * creating a separate "sale" per payment method.
 */
export async function createSaleEntryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUserSession();
  const parsed = entrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const amounts = extractAmounts(formData);
  if (amounts.length === 0) return { error: "Enter an amount for at least one payment method." };

  try {
    await verifyRelations(
      session.tenantId,
      parsed.data.branchId,
      parsed.data.workerId,
      amounts.map((a) => a.paymentMethodId)
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid selection." };
  }

  const date = new Date(parsed.data.date);
  const sales = await prisma.$transaction(
    amounts.map((a) =>
      prisma.sale.create({
        data: {
          tenantId: session.tenantId,
          branchId: parsed.data.branchId,
          workerId: parsed.data.workerId,
          date,
          amount: a.amount,
          paymentMethodId: a.paymentMethodId,
          reference: parsed.data.reference || null,
          notes: parsed.data.notes || null,
        },
      })
    )
  );

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "SALE_CREATED",
    entityType: "Sale",
    entityId: sales[0]?.id,
    metadata: { count: sales.length, total: amounts.reduce((sum, a) => sum + a.amount, 0) },
  });

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return { success: "Sale recorded." };
}

/** Deletes every Sale row in a pivoted table row at once (one row can represent multiple underlying Sale records, one per payment method). */
export async function deleteSaleGroupAction(saleIds: string[]) {
  const session = await requireUserSession();
  if (saleIds.length === 0) return;

  const result = await prisma.sale.updateMany({
    where: { id: { in: saleIds }, tenantId: session.tenantId, deletedAt: null },
    data: { deletedAt: new Date(), deletedBy: session.userId },
  });
  if (result.count === 0) return;

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "SALE_DELETED",
    entityType: "Sale",
    metadata: { saleIds },
  });

  revalidatePath("/sales");
  revalidatePath("/dashboard");
}
