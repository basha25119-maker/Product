import { requireAdminSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { setTenantStatusAction } from "@/actions/admin";
import { ResetPasswordButton } from "./ResetPasswordButton";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";

const statusTone = { ACTIVE: "success", SUSPENDED: "danger", INACTIVE: "muted" } as const;

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const admin = await requireAdminSession();
  const tenant = await prisma.tenant.findUnique({
    where: { id: params.id },
    include: {
      users: true,
      subscription: true,
      _count: { select: { branches: true, workers: true, sales: true } },
    },
  });

  if (!tenant) notFound();

  return (
    <AdminShell adminEmail={admin.email}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
          <p className="text-sm text-muted-foreground">Customer account overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={statusTone[tenant.status]}>{tenant.status}</Badge>
          {tenant.status === "ACTIVE" ? (
            <ConfirmButton
              action={setTenantStatusAction.bind(null, tenant.id, "SUSPENDED")}
              confirmText={`Suspend ${tenant.name}? They will lose dashboard access immediately; their data is kept intact.`}
              className="rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/5"
            >
              Suspend Customer
            </ConfirmButton>
          ) : (
            <ConfirmButton
              action={setTenantStatusAction.bind(null, tenant.id, "ACTIVE")}
              confirmText={`Reactivate ${tenant.name}?`}
              className="rounded-lg border border-success/30 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/5"
            >
              Reactivate Customer
            </ConfirmButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{tenant.email ?? "-"}</dd>
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{tenant.phone ?? "-"}</dd>
              <dt className="text-muted-foreground">Currency</dt>
              <dd>{tenant.currency}</dd>
              <dt className="text-muted-foreground">Timezone</dt>
              <dd>{tenant.timezone}</dd>
              <dt className="text-muted-foreground">Plan</dt>
              <dd>{tenant.subscription?.plan ?? "-"}</dd>
              <dt className="text-muted-foreground">Subscription Status</dt>
              <dd>{tenant.subscription?.status ?? "-"}</dd>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatDate(tenant.createdAt)}</dd>
              <dt className="text-muted-foreground">Branches</dt>
              <dd>{tenant._count.branches}</dd>
              <dt className="text-muted-foreground">Workers</dt>
              <dd>{tenant._count.workers}</dd>
              <dt className="text-muted-foreground">Sales Recorded</dt>
              <dd>{tenant._count.sales}</dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {tenant.users.map((u) => (
                <li key={u.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                  <p className="mb-2 text-xs text-muted-foreground">{u.role}</p>
                  <ResetPasswordButton userId={u.id} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
