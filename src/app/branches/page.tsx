import { requireUserSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Table, Thead, Th, Tbody, Tr, Td, EmptyState } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { NewRecordPanel } from "@/components/ui/NewRecordPanel";
import { BranchForm } from "./BranchForm";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { setBranchStatusAction } from "@/actions/branches";
import Link from "next/link";

export default async function BranchesPage() {
  const session = await requireUserSession();
  const [user, tenant, branches] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.branch.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { workers: true } } },
    }),
  ]);

  return (
    <DashboardShell businessName={tenant?.name ?? ""} userEmail={user?.email ?? ""}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
          <p className="text-sm text-muted-foreground">Manage your shop locations.</p>
        </div>
        <NewRecordPanel label="Add Branch">{(close) => <BranchForm onDone={close} />}</NewRecordPanel>
      </div>

      <Table>
        <Thead>
          <tr>
            <Th>Name</Th>
            <Th>Address</Th>
            <Th>Phone</Th>
            <Th>Workers</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </Thead>
        <Tbody>
          {branches.map((b) => (
            <Tr key={b.id}>
              <Td className="font-medium">
                <Link href={`/branches/${b.id}/edit`} className="hover:underline">
                  {b.name}
                </Link>
              </Td>
              <Td className="text-muted-foreground">{b.address || "-"}</Td>
              <Td className="text-muted-foreground">{b.phone || "-"}</Td>
              <Td>{b._count.workers}</Td>
              <Td>
                <Badge tone={b.status === "ACTIVE" ? "success" : "muted"}>{b.status}</Badge>
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-3">
                  <Link href={`/branches/${b.id}/edit`} className="text-xs font-medium text-accent hover:underline">
                    Edit
                  </Link>
                  {b.status === "ACTIVE" ? (
                    <ConfirmButton
                      action={setBranchStatusAction.bind(null, b.id, "INACTIVE")}
                      confirmText={`Deactivate ${b.name}?`}
                      className="text-danger hover:underline"
                    >
                      Deactivate
                    </ConfirmButton>
                  ) : (
                    <ConfirmButton
                      action={setBranchStatusAction.bind(null, b.id, "ACTIVE")}
                      confirmText={`Reactivate ${b.name}?`}
                      className="text-success hover:underline"
                    >
                      Activate
                    </ConfirmButton>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {branches.length === 0 && <EmptyState title="No branches yet" description="Add your first branch to get started." />}
    </DashboardShell>
  );
}
