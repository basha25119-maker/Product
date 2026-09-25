import { requireUserSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { BusinessForm } from "./BusinessForm";
import { AddPaymentMethodForm, AddCategoryForm, PaymentMethodRow, ChangePasswordForm } from "./SmallForms";
import { Badge } from "@/components/ui/Badge";

export default async function SettingsPage() {
  const session = await requireUserSession();
  const [user, tenant, paymentMethods, categories] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.paymentMethod.findMany({ where: { tenantId: session.tenantId }, orderBy: { createdAt: "asc" } }),
    prisma.expenseCategory.findMany({
      where: { OR: [{ tenantId: session.tenantId }, { isGlobalDefault: true }] },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!tenant || !user) return null;

  return (
    <DashboardShell businessName={tenant.name} userEmail={user.email}>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Settings</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
          </CardHeader>
          <CardContent>
            <BusinessForm tenant={tenant} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="mb-4 space-y-2">
              {paymentMethods.map((p) => (
                <PaymentMethodRow key={p.id} id={p.id} name={p.name} isActive={p.isActive} />
              ))}
            </ul>
            <AddPaymentMethodForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="mb-4 space-y-2">
              {categories.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span>{c.name}</span>
                  {c.isGlobalDefault && <Badge tone="accent">Default</Badge>}
                </li>
              ))}
            </ul>
            <AddCategoryForm />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
