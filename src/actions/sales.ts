"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/guards";
import { writeAuditLog } from "@/lib/audit";
import { assertBranchOwnedByTenant, assertWorkerOwnedByTenant, assertPaymentMethodOwnedByTenant } from "@/lib/ownership";

export type ActionState = { error?: string; success?: string } | undefined;

const saleSchema = z.object({
  branchId: z.string().min(1, "Branch is required."),
  workerId: z.string().min(1, "Worker is required."),
  date: z.string().min(1, "Date is required."),
  amount: z.string().min(1, "Amount is required."),
  paymentMethodId: z.string().min(1, "Payment method is required."),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

async function verifyRelations(tenantId: string, branchId: string, workerId: string, paymentMethodId: string) {
  await assertBranchOwnedByTenant(branchId, tenantId);
  const worker = await assertWorkerOwnedByTenant(workerId, tenantId);
  if (worker.branchId && worker.branchId !== branchId) {
    throw new Error("Selected worker does not belong to the selected branch.");
  }
  await assertPaymentMethodOwnedByTenant(paymentMethodId, tenantId);
}

export async function createSaleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUserSession();
  const parsed = saleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const amount = parseFloat(parsed.data.amount);
  if (isNaN(amount) || amount <= 0) return { error: "Enter a valid amount." };

  try {
    await verifyRelations(session.tenantId, parsed.data.branchId, parsed.data.workerId, parsed.data.paymentMethodId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid selection." };
  }

  const sale = await prisma.sale.create({
    data: {
      tenantId: session.tenantId,
      branchId: parsed.data.branchId,
      workerId: parsed.data.workerId,
      date: new Date(parsed.data.date),
      amount,
      paymentMethodId: parsed.data.paymentMethodId,
      reference: parsed.data.reference || null,
      notes: parsed.data.notes || null,
    },
  });

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "SALE_CREATED",
    entityType: "Sale",
    entityId: sale.id,
    metadata: { amount },
  });

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return { success: "Sale recorded." };
}

export async function updateSaleAction(saleId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUserSession();
  const parsed = saleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const amount = parseFloat(parsed.data.amount);
  if (isNaN(amount) || amount <= 0) return { error: "Enter a valid amount." };

  try {
    await verifyRelations(session.tenantId, parsed.data.branchId, parsed.data.workerId, parsed.data.paymentMethodId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid selection." };
  }

  const result = await prisma.sale.updateMany({
    where: { id: saleId, tenantId: session.tenantId },
    data: {
      branchId: parsed.data.branchId,
      workerId: parsed.data.workerId,
      date: new Date(parsed.data.date),
      amount,
      paymentMethodId: parsed.data.paymentMethodId,
      reference: parsed.data.reference || null,
      notes: parsed.data.notes || null,
    },
  });
  if (result.count === 0) return { error: "Sale not found." };

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "SALE_UPDATED",
    entityType: "Sale",
    entityId: saleId,
  });

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  return { success: "Sale updated." };
}

export async function deleteSaleAction(saleId: string) {
  const session = await requireUserSession();
  const result = await prisma.sale.updateMany({
    where: { id: saleId, tenantId: session.tenantId, deletedAt: null },
    data: { deletedAt: new Date(), deletedBy: session.userId },
  });
  if (result.count === 0) return;

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "SALE_DELETED",
    entityType: "Sale",
    entityId: saleId,
  });

  revalidatePath("/sales");
  revalidatePath("/dashboard");
}
