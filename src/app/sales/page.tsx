import { requireUserSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Table, Thead, Th, Tbody, Tr, Td, EmptyState } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { deleteSaleGroupAction } from "@/actions/sales";
import { formatMoney, formatDate, toNumber } from "@/lib/utils";
import { resolveRange } from "@/lib/date-range";
import { FiltersBar } from "../dashboard/FiltersBar";
import Link from "next/link";
import { Plus } from "lucide-react";

type SaleRow = {
  key: string;
  date: Date;
  branchName: string;
  workerName: string;
  reference: string | null;
  amounts: Map<string, number>;
  ids: string[];
  total: number;
};

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
      include: {
        branch: { select: { name: true } },
        worker: { select: { firstName: true, lastName: true } },
        paymentMethod: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
      take: 500,
    }),
  ]);

  const currency = tenant?.currency ?? "GBP";

  // Pivot: one row per (date, branch, worker), one column per payment method actually used.
  const methodColumns = new Map<string, string>(); // id -> name
  const rowsByKey = new Map<string, SaleRow>();

  for (const s of sales) {
    methodColumns.set(s.paymentMethodId, s.paymentMethod.name);
    const key = `${s.date.toISOString()}|${s.branchId}|${s.workerId}`;
    let row = rowsByKey.get(key);
    if (!row) {
      row = {
        key,
        date: s.date,
        branchName: s.branch.name,
        workerName: `${s.worker.firstName} ${s.worker.lastName}`,
        reference: s.reference,
        amounts: new Map(),
        ids: [],
        total: 0,
      };
      rowsByKey.set(key, row);
    }
    const amount = toNumber(s.amount);
    row.amounts.set(s.paymentMethodId, (row.amounts.get(s.paymentMethodId) ?? 0) + amount);
    row.total += amount;
    row.ids.push(s.id);
  }

  const columns = Array.from(methodColumns.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const rows = Array.from(rowsByKey.values()).sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <DashboardShell businessName={tenant?.name ?? ""} userEmail={user?.email ?? ""}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
          <p className="text-sm text-muted-foreground">One row per worker per day, split by payment method.</p>
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
            <Th>Reference</Th>
            {columns.map((c) => (
              <Th key={c.id} className="text-right">
                {c.name}
              </Th>
            ))}
            <Th className="text-right">Total</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </Thead>
        <Tbody>
          {rows.map((r) => (
            <Tr key={r.key}>
              <Td>{formatDate(r.date)}</Td>
              <Td>{r.branchName}</Td>
              <Td>{r.workerName}</Td>
              <Td className="text-muted-foreground">{r.reference || "-"}</Td>
              {columns.map((c) => (
                <Td key={c.id} className="text-right text-muted-foreground">
                  {r.amounts.has(c.id) ? formatMoney(r.amounts.get(c.id)!, currency) : "-"}
                </Td>
              ))}
              <Td className="text-right font-semibold">{formatMoney(r.total, currency)}</Td>
              <Td className="text-right">
                <ConfirmButton
                  action={deleteSaleGroupAction.bind(null, r.ids)}
                  confirmText="Delete this day's sale entry? It will be soft-deleted and removed from reports."
                  className="text-danger hover:underline"
                >
                  Delete
                </ConfirmButton>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {rows.length === 0 && <EmptyState title="No sales recorded" description="Add your first sale to see it here." />}
    </DashboardShell>
  );
}
