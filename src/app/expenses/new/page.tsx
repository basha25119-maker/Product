import { requireUserSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ExpenseForm } from "../ExpenseForm";

export default async function NewExpensePage() {
  const session = await requireUserSession();
  const [user, tenant, branches, categories, paymentMethods] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.branch.findMany({ where: { tenantId: session.tenantId, status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.expenseCategory.findMany({
      where: { OR: [{ tenantId: session.tenantId }, { isGlobalDefault: true }] },
      orderBy: { name: "asc" },
    }),
    prisma.paymentMethod.findMany({ where: { tenantId: session.tenantId, isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <DashboardShell businessName={tenant?.name ?? ""} userEmail={user?.email ?? ""}>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Add Expense</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>New Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm branches={branches} categories={categories} paymentMethods={paymentMethods} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
