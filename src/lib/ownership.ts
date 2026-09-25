import { prisma } from "./prisma";

/**
 * Defence-in-depth: every foreign key referenced in a mutation (branchId,
 * workerId, paymentMethodId, categoryId, ...) must be re-verified server-side
 * as belonging to the caller's tenant, even though it also appears in a
 * `where: { tenantId }` filter on the parent query. This stops a client from
 * pointing a legitimately-owned record at another tenant's branch/worker/etc.
 */
export async function assertBranchOwnedByTenant(branchId: string, tenantId: string) {
  const branch = await prisma.branch.findFirst({ where: { id: branchId, tenantId } });
  if (!branch) throw new OwnershipError("Branch not found in your workspace.");
  return branch;
}

export async function assertWorkerOwnedByTenant(workerId: string, tenantId: string) {
  const worker = await prisma.worker.findFirst({ where: { id: workerId, tenantId } });
  if (!worker) throw new OwnershipError("Worker not found in your workspace.");
  return worker;
}

export async function assertPaymentMethodOwnedByTenant(paymentMethodId: string, tenantId: string) {
  const pm = await prisma.paymentMethod.findFirst({ where: { id: paymentMethodId, tenantId } });
  if (!pm) throw new OwnershipError("Payment method not found in your workspace.");
  return pm;
}

export async function assertCategoryOwnedByTenant(categoryId: string, tenantId: string) {
  const cat = await prisma.expenseCategory.findFirst({
    where: { id: categoryId, OR: [{ tenantId }, { isGlobalDefault: true }] },
  });
  if (!cat) throw new OwnershipError("Expense category not found in your workspace.");
  return cat;
}

export class OwnershipError extends Error {}
