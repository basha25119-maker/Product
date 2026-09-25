import { requireUserSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { RentForm } from "../RentForm";

export default async function NewRentPage() {
  const session = await requireUserSession();
  const [user, tenant, branches] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.branch.findMany({ where: { tenantId: session.tenantId, status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <DashboardShell businessName={tenant?.name ?? ""} userEmail={user?.email ?? ""}>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Add Rent Payment</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>New Rent Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <RentForm branches={branches} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
