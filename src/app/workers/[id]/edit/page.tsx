import { requireUserSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { WorkerForm } from "../../WorkerForm";
import { notFound } from "next/navigation";
import { toNumber } from "@/lib/utils";

export default async function EditWorkerPage({ params }: { params: { id: string } }) {
  const session = await requireUserSession();
  const [user, tenant, worker, branches] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.worker.findFirst({ where: { id: params.id, tenantId: session.tenantId } }),
    prisma.branch.findMany({ where: { tenantId: session.tenantId, status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  if (!worker) notFound();

  return (
    <DashboardShell businessName={tenant?.name ?? ""} userEmail={user?.email ?? ""}>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Edit Worker</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            {worker.firstName} {worker.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WorkerForm
            branches={branches}
            worker={{
              ...worker,
              defaultWageAmount: worker.defaultWageAmount ? String(toNumber(worker.defaultWageAmount)) : null,
            }}
          />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
