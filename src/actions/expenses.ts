"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/guards";
import { writeAuditLog } from "@/lib/audit";
import { assertBranchOwnedByTenant, assertCategoryOwnedByTenant, assertPaymentMethodOwnedByTenant } from "@/lib/ownership";

export type ActionState = { error?: string; success?: string } | undefined;

const expenseSchema = z.object({
  branchId: z.string().min(1, "Branch is required."),
  categoryId: z.string().min(1, "Category is required."),
  date: z.string().min(1, "Date is required."),
  amount: z.string().min(1, "Amount is required."),
  paymentMethodId: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export async function createExpenseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUserSession();
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const amount = parseFloat(parsed.data.amount);
  if (isNaN(amount) || amount <= 0) return { error: "Enter a valid amount." };

  try {
    await assertBranchOwnedByTenant(parsed.data.branchId, session.tenantId);
    await assertCategoryOwnedByTenant(parsed.data.categoryId, session.tenantId);
    if (parsed.data.paymentMethodId) {
      await assertPaymentMethodOwnedByTenant(parsed.data.paymentMethodId, session.tenantId);
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid selection." };
  }

  const expense = await prisma.expense.create({
    data: {
      tenantId: session.tenantId,
      branchId: parsed.data.branchId,
      categoryId: parsed.data.categoryId,
      date: new Date(parsed.data.date),
      amount,
      paymentMethodId: parsed.data.paymentMethodId || null,
      description: parsed.data.description || null,
      notes: parsed.data.notes || null,
    },
  });

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "EXPENSE_CREATED",
    entityType: "Expense",
    entityId: expense.id,
    metadata: { amount },
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: "Expense recorded." };
}

export async function deleteExpenseAction(expenseId: string) {
  const session = await requireUserSession();
  const result = await prisma.expense.updateMany({
    where: { id: expenseId, tenantId: session.tenantId, deletedAt: null },
    data: { deletedAt: new Date(), deletedBy: session.userId },
  });
  if (result.count === 0) return;

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "EXPENSE_DELETED",
    entityType: "Expense",
    entityId: expenseId,
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

const categorySchema = z.object({ name: z.string().min(1, "Category name is required.") });

export async function createExpenseCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUserSession();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await prisma.expenseCategory.create({
    data: { tenantId: session.tenantId, name: parsed.data.name },
  });

  revalidatePath("/settings");
  revalidatePath("/expenses");
  return { success: "Category added." };
}
