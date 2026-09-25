import { requireUserSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { WageForm } from "../WageForm";

export default async function NewWagePage() {
  const session = await requireUserSession();
  const [user, tenant, branches, workers, paymentMethods] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.branch.findMany({ where: { tenantId: session.tenantId, status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.worker.findMany({ where: { tenantId: session.tenantId, status: "ACTIVE" }, orderBy: { firstName: "asc" } }),
    prisma.paymentMethod.findMany({ where: { tenantId: session.tenantId, isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <DashboardShell businessName={tenant?.name ?? ""} userEmail={user?.email ?? ""}>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Add Wage Payment</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>New Wage Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <WageForm branches={branches} workers={workers} paymentMethods={paymentMethods} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
