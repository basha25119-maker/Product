import { requireAdminSession } from "@/lib/guards";
import { AdminShell } from "@/components/layout/AdminShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default async function AdminSettingsPage() {
  const admin = await requireAdminSession();

  return (
    <AdminShell adminEmail={admin.email}>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">System Settings</h1>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Platform Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Subscription plans, billing integration, and platform-wide configuration will appear here as the platform grows.
            Signed in as <span className="font-medium text-foreground">{admin.email}</span>.
          </p>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
