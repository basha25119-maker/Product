import { requireUserSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table, Thead, Th, Tbody, Tr, Td, EmptyState } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { AttendanceGrid } from "./AttendanceGrid";
import { WagesFilters } from "./WagesFilters";
import { daysInMonth, monthRange, toDateKey, computePayFromCounts } from "@/lib/attendance";
import { formatMoney, toNumber } from "@/lib/utils";
import Link from "next/link";
import { History } from "lucide-react";

export default async function WagesPage({ searchParams }: { searchParams: { month?: string; branch?: string } }) {
  const session = await requireUserSession();
  const month = searchParams.month && /^\d{4}-\d{2}$/.test(searchParams.month) ? searchParams.month : new Date().toISOString().slice(0, 7);
  const { from, to } = monthRange(month);
  const days = daysInMonth(month);

  const [user, tenant, branches, workers, attendance] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.branch.findMany({ where: { tenantId: session.tenantId, status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.worker.findMany({
      where: { tenantId: session.tenantId, status: "ACTIVE", ...(searchParams.branch ? { branchId: searchParams.branch } : {}) },
      orderBy: { firstName: "asc" },
    }),
    prisma.attendance.findMany({
      where: {
        tenantId: session.tenantId,
        date: { gte: from, lte: to },
        ...(searchParams.branch ? { branchId: searchParams.branch } : {}),
      },
    }),
  ]);

  const currency = tenant?.currency ?? "GBP";

  const initial: Record<string, "FULL_DAY" | "HALF_DAY" | "ABSENT"> = {};
  const countsByWorker = new Map<string, { full: number; half: number; absent: number }>();
  for (const a of attendance) {
    initial[`${a.workerId}|${toDateKey(a.date)}`] = a.status;
    const c = countsByWorker.get(a.workerId) ?? { full: 0, half: 0, absent: 0 };
    if (a.status === "FULL_DAY") c.full++;
    else if (a.status === "HALF_DAY") c.half++;
    else c.absent++;
    countsByWorker.set(a.workerId, c);
  }

  const payroll = workers.map((w) => {
    const c = countsByWorker.get(w.id) ?? { full: 0, half: 0, absent: 0 };
    const dailyRate = toNumber(w.defaultWageAmount);
    const amount = computePayFromCounts(dailyRate, c.full, c.half);
    return { worker: w, ...c, dailyRate, amount };
  });

  return (
    <DashboardShell businessName={tenant?.name ?? ""} userEmail={user?.email ?? ""}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wages &amp; Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Mark each worker's daily attendance and pay is calculated automatically from their daily rate.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <WagesFilters branches={branches} month={month} />
          <Link href="/wages/history">
            <Button size="sm" variant="outline">
              <History size={15} /> Payment History
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Attendance — {month}</CardTitle>
        </CardHeader>
        <CardContent>
          {workers.length === 0 ? (
            <EmptyState title="No active workers" description="Add a worker first to track attendance." />
          ) : (
            <AttendanceGrid workers={workers} days={days} initial={initial} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Summary — {month}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <Thead>
              <tr>
                <Th>Worker</Th>
                <Th className="text-right">Daily Rate</Th>
                <Th className="text-right">Full Days</Th>
                <Th className="text-right">Half Days</Th>
                <Th className="text-right">Absent</Th>
                <Th className="text-right">Calculated Pay</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {payroll.map((p) => (
                <Tr key={p.worker.id}>
                  <Td className="font-medium">
                    {p.worker.firstName} {p.worker.lastName}
                  </Td>
                  <Td className="text-right text-muted-foreground">
                    {p.dailyRate > 0 ? formatMoney(p.dailyRate, currency) : <span className="text-warning">Not set</span>}
                  </Td>
                  <Td className="text-right">{p.full}</Td>
                  <Td className="text-right">{p.half}</Td>
                  <Td className="text-right">{p.absent}</Td>
                  <Td className="text-right font-semibold">{formatMoney(p.amount, currency)}</Td>
                  <Td className="text-right">
                    <Link
                      href={`/wages/new?workerId=${p.worker.id}&branchId=${p.worker.branchId ?? ""}&amount=${p.amount.toFixed(2)}&payPeriodStart=${from.toISOString().slice(0, 10)}&payPeriodEnd=${to.toISOString().slice(0, 10)}`}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      Record Payment
                    </Link>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          {payroll.length === 0 && <EmptyState title="No workers to pay" />}
          <p className="mt-3 text-xs text-muted-foreground">
            Daily rate comes from each worker's "Default Wage Amount" (Workers → Edit). Half days pay 50% of the
            daily rate; absent days pay nothing.
          </p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
