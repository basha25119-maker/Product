import { requireUserSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Table, Thead, Th, Tbody, Tr, Td, EmptyState } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { deleteSaleAction } from "@/actions/sales";
import { formatMoney, formatDate } from "@/lib/utils";
import { resolveRange } from "@/lib/date-range";
import { FiltersBar } from "../dashboard/FiltersBar";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function SalesPage({ searchParams }: { searchParams: { branch?: string; range?: string } }) {
  const session = await requireUserSession();
  const { from, to } = resolveRange(searchParams.range);

  const [user, tenant, branches, sales] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.branch.findMany({ where: { tenantId: session.tenantId }, orderBy: { name: "asc" } }),
    prisma.sale.findMany({
      where: {
        tenantId: session.tenantId,
        deletedAt: null,
        ...(searchParams.branch ? { branchId: searchParams.branch } : {}),
        ...(from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      },
      include: { branch: { select: { name: true } }, worker: { select: { firstName: true, lastName: true } }, paymentMethod: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 200,
    }),
  ]);

  const currency = tenant?.currency ?? "GBP";

  return (
    <DashboardShell businessName={tenant?.name ?? ""} userEmail={user?.email ?? ""}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
          <p className="text-sm text-muted-foreground">All recorded sales transactions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FiltersBar branches={branches} />
          <Link href="/sales/new">
            <Button size="sm">
              <Plus size={15} /> Add Sale
            </Button>
          </Link>
        </div>
      </div>

      <Table>
        <Thead>
          <tr>
            <Th>Date</Th>
            <Th>Branch</Th>
            <Th>Worker</Th>
            <Th>Payment</Th>
            <Th>Reference</Th>
            <Th className="text-right">Amount</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </Thead>
        <Tbody>
          {sales.map((s) => (
            <Tr key={s.id}>
              <Td>{formatDate(s.date)}</Td>
              <Td>{s.branch.name}</Td>
              <Td>
                {s.worker.firstName} {s.worker.lastName}
              </Td>
              <Td className="text-muted-foreground">{s.paymentMethod.name}</Td>
              <Td className="text-muted-foreground">{s.reference || "-"}</Td>
              <Td className="text-right font-semibold">{formatMoney(s.amount as unknown as number, currency)}</Td>
              <Td className="text-right">
                <ConfirmButton
                  action={deleteSaleAction.bind(null, s.id)}
                  confirmText="Delete this sale? It will be soft-deleted and removed from reports."
                  className="text-danger hover:underline"
                >
                  Delete
                </ConfirmButton>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {sales.length === 0 && <EmptyState title="No sales recorded" description="Add your first sale to see it here." />}
    </DashboardShell>
  );
}
