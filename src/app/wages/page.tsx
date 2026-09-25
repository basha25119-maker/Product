import { requireUserSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Table, Thead, Th, Tbody, Tr, Td, EmptyState } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { deleteWageAction } from "@/actions/wages";
import { formatMoney, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function WagesPage() {
  const session = await requireUserSession();
  const [user, tenant, wages] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.wagePayment.findMany({
      where: { tenantId: session.tenantId, deletedAt: null },
      include: { branch: { select: { name: true } }, worker: { select: { firstName: true, lastName: true } } },
      orderBy: { date: "desc" },
      take: 200,
    }),
  ]);
  const currency = tenant?.currency ?? "GBP";

  return (
    <DashboardShell businessName={tenant?.name ?? ""} userEmail={user?.email ?? ""}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wages</h1>
          <p className="text-sm text-muted-foreground">Wage payments to your workers.</p>
        </div>
        <Link href="/wages/new">
          <Button size="sm">
            <Plus size={15} /> Add Wage
          </Button>
        </Link>
      </div>

      <Table>
        <Thead>
          <tr>
            <Th>Date</Th>
            <Th>Branch</Th>
            <Th>Worker</Th>
            <Th>Pay Period</Th>
            <Th className="text-right">Amount</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </Thead>
        <Tbody>
          {wages.map((w) => (
            <Tr key={w.id}>
              <Td>{formatDate(w.date)}</Td>
              <Td>{w.branch.name}</Td>
              <Td>
                {w.worker.firstName} {w.worker.lastName}
              </Td>
              <Td className="text-muted-foreground">
                {w.payPeriodStart && w.payPeriodEnd ? `${formatDate(w.payPeriodStart)} - ${formatDate(w.payPeriodEnd)}` : "-"}
              </Td>
              <Td className="text-right font-semibold">{formatMoney(w.amount as unknown as number, currency)}</Td>
              <Td className="text-right">
                <ConfirmButton action={deleteWageAction.bind(null, w.id)} confirmText="Delete this wage payment?" className="text-danger hover:underline">
                  Delete
                </ConfirmButton>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {wages.length === 0 && <EmptyState title="No wage payments yet" />}
    </DashboardShell>
  );
}
