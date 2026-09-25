import { requireAdminSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/AdminShell";
import { StatCard } from "@/components/ui/StatCard";
import { Users2, UserCheck, UserX, Building } from "lucide-react";

export default async function AdminDashboardPage() {
  const admin = await requireAdminSession();

  const [total, active, suspended, businesses] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.tenant.count({ where: { status: "SUSPENDED" } }),
    prisma.tenant.count(),
  ]);

  return (
    <AdminShell adminEmail={admin.email}>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Platform Dashboard</h1>
      <p className="mb-6 text-sm text-muted-foreground">Operator overview across all customers.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Customers" value={String(total)} icon={Users2} />
        <StatCard label="Active Customers" value={String(active)} icon={UserCheck} />
        <StatCard label="Suspended Customers" value={String(suspended)} icon={UserX} />
        <StatCard label="Total Businesses" value={String(businesses)} icon={Building} />
      </div>
    </AdminShell>
  );
}
