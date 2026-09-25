import { requireUserSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Table, Thead, Th, Tbody, Tr, Td, EmptyState } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { NewRecordPanel } from "@/components/ui/NewRecordPanel";
import { WorkerForm } from "./WorkerForm";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { setWorkerStatusAction } from "@/actions/workers";
import Link from "next/link";

const statusTone = { ACTIVE: "success", INACTIVE: "muted", LEFT: "warning" } as const;

export default async function WorkersPage() {
  const session = await requireUserSession();
  const [user, tenant, workers, branches] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.worker.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: "desc" },
      include: { branch: { select: { name: true } } },
    }),
    prisma.branch.findMany({ where: { tenantId: session.tenantId, status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <DashboardShell businessName={tenant?.name ?? ""} userEmail={user?.email ?? ""}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workers</h1>
          <p className="text-sm text-muted-foreground">Your barbers and staff.</p>
        </div>
        <NewRecordPanel label="Add Worker">{(close) => <WorkerForm branches={branches} onDone={close} />}</NewRecordPanel>
      </div>

      <Table>
        <Thead>
          <tr>
            <Th>Name</Th>
            <Th>Branch</Th>
            <Th>Wage Type</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </Thead>
        <Tbody>
          {workers.map((w) => (
            <Tr key={w.id}>
              <Td className="font-medium">
                <Link href={`/workers/${w.id}/edit`} className="hover:underline">
                  {w.displayName || `${w.firstName} ${w.lastName}`}
                </Link>
              </Td>
              <Td className="text-muted-foreground">{w.branch?.name || "Unassigned"}</Td>
              <Td className="text-muted-foreground">{w.wageType}</Td>
              <Td>
                <Badge tone={statusTone[w.status]}>{w.status}</Badge>
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-3">
                  <Link href={`/workers/${w.id}/edit`} className="text-xs font-medium text-accent hover:underline">
                    Edit
                  </Link>
                  {w.status !== "LEFT" && (
                    <ConfirmButton
                      action={setWorkerStatusAction.bind(null, w.id, "LEFT")}
                      confirmText={`Mark ${w.firstName} as left? Historical records are kept.`}
                      className="text-danger hover:underline"
                    >
                      Mark as Left
                    </ConfirmButton>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {workers.length === 0 && <EmptyState title="No workers yet" description="Add your first barber to get started." />}
    </DashboardShell>
  );
}
