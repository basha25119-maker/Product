import { requireUserSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Table, Thead, Th, Tbody, Tr, Td, EmptyState } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { deleteRentAction } from "@/actions/rent";
import { formatMoney, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function RentPage() {
  const session = await requireUserSession();
  const [user, tenant, rents] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.rentPayment.findMany({
      where: { tenantId: session.tenantId, deletedAt: null },
      include: { branch: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 200,
    }),
  ]);
  const currency = tenant?.currency ?? "GBP";

  return (
    <DashboardShell businessName={tenant?.name ?? ""} userEmail={user?.email ?? ""}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rent</h1>
          <p className="text-sm text-muted-foreground">Rent payments per branch.</p>
        </div>
        <Link href="/rent/new">
          <Button size="sm">
            <Plus size={15} /> Add Rent
          </Button>
        </Link>
      </div>

      <Table>
        <Thead>
          <tr>
            <Th>Date</Th>
            <Th>Branch</Th>
            <Th>Period</Th>
            <Th className="text-right">Amount</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </Thead>
        <Tbody>
          {rents.map((r) => (
            <Tr key={r.id}>
              <Td>{formatDate(r.date)}</Td>
              <Td>{r.branch.name}</Td>
              <Td className="text-muted-foreground">{r.periodStart && r.periodEnd ? `${formatDate(r.periodStart)} - ${formatDate(r.periodEnd)}` : "-"}</Td>
              <Td className="text-right font-semibold">{formatMoney(r.amount as unknown as number, currency)}</Td>
              <Td className="text-right">
                <ConfirmButton action={deleteRentAction.bind(null, r.id)} confirmText="Delete this rent payment?" className="text-danger hover:underline">
                  Delete
                </ConfirmButton>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {rents.length === 0 && <EmptyState title="No rent payments yet" />}
    </DashboardShell>
  );
}
