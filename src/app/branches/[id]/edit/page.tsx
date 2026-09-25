import { requireUserSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BranchForm } from "../../BranchForm";
import { notFound } from "next/navigation";

export default async function EditBranchPage({ params }: { params: { id: string } }) {
  const session = await requireUserSession();
  const [user, tenant, branch] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    // Scoped by tenantId — a cross-tenant branch id renders a 404, not someone else's data.
    prisma.branch.findFirst({ where: { id: params.id, tenantId: session.tenantId } }),
  ]);

  if (!branch) notFound();

  return (
    <DashboardShell businessName={tenant?.name ?? ""} userEmail={user?.email ?? ""}>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Edit Branch</h1>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{branch.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <BranchForm branch={branch} />
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
