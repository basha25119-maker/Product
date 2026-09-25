import { requireUserSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Table, Thead, Th, Tbody, Tr, Td, EmptyState } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { deleteExpenseAction } from "@/actions/expenses";
import { formatMoney, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ExpensesPage() {
  const session = await requireUserSession();
  const [user, tenant, expenses] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.expense.findMany({
      where: { tenantId: session.tenantId, deletedAt: null },
      include: { branch: { select: { name: true } }, category: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 200,
    }),
  ]);
  const currency = tenant?.currency ?? "GBP";

  return (
    <DashboardShell businessName={tenant?.name ?? ""} userEmail={user?.email ?? ""}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">Other business expenses.</p>
        </div>
        <Link href="/expenses/new">
          <Button size="sm">
            <Plus size={15} /> Add Expense
          </Button>
        </Link>
      </div>

      <Table>
        <Thead>
          <tr>
            <Th>Date</Th>
            <Th>Branch</Th>
            <Th>Category</Th>
            <Th>Description</Th>
            <Th className="text-right">Amount</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </Thead>
        <Tbody>
          {expenses.map((e) => (
            <Tr key={e.id}>
              <Td>{formatDate(e.date)}</Td>
              <Td>{e.branch.name}</Td>
              <Td className="text-muted-foreground">{e.category.name}</Td>
              <Td className="text-muted-foreground">{e.description || "-"}</Td>
              <Td className="text-right font-semibold">{formatMoney(e.amount as unknown as number, currency)}</Td>
              <Td className="text-right">
                <ConfirmButton action={deleteExpenseAction.bind(null, e.id)} confirmText="Delete this expense?" className="text-danger hover:underline">
                  Delete
                </ConfirmButton>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {expenses.length === 0 && <EmptyState title="No expenses recorded" />}
    </DashboardShell>
  );
}
