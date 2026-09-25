import { Fragment } from "react";
import { requireUserSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { FiltersBar } from "../dashboard/FiltersBar";
import { getFinancialSummary, getSalesByBranch, getSalesByWorker, getPaymentMethodBreakdown } from "@/lib/finance";
import { resolveRange } from "@/lib/date-range";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";

export default async function ReportsPage({ searchParams }: { searchParams: { branch?: string; range?: string } }) {
  const session = await requireUserSession();
  const [user, tenant, branches] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.branch.findMany({ where: { tenantId: session.tenantId }, orderBy: { name: "asc" } }),
  ]);

  const { from, to } = resolveRange(searchParams.range);
  const filters = { tenantId: session.tenantId, branchId: searchParams.branch, from, to };

  const [summary, salesByBranch, salesByWorker, paymentBreakdown] = await Promise.all([
    getFinancialSummary(filters),
    getSalesByBranch(filters),
    getSalesByWorker(filters),
    getPaymentMethodBreakdown(filters),
  ]);

  const currency = tenant?.currency ?? "GBP";
  const qs = new URLSearchParams({
    ...(searchParams.branch ? { branch: searchParams.branch } : {}),
    ...(searchParams.range ? { range: searchParams.range } : {}),
  }).toString();

  return (
    <DashboardShell businessName={tenant?.name ?? ""} userEmail={user?.email ?? ""}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Sales, profit &amp; loss, branch and worker performance.</p>
        </div>
        <FiltersBar branches={branches} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Report</CardTitle>
            <a href={`/api/reports/export?type=sales&${qs}`}>
              <Button size="sm" variant="outline">
                <Download size={14} /> CSV
              </Button>
            </a>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Total Sales</dt>
              <dd className="text-right font-semibold">{formatMoney(summary.revenue, currency)}</dd>
              <dt className="text-muted-foreground">Transaction Count</dt>
              <dd className="text-right font-semibold">{summary.transactionCount}</dd>
              <dt className="text-muted-foreground">Average Transaction</dt>
              <dd className="text-right font-semibold">{formatMoney(summary.avgTransaction, currency)}</dd>
              {paymentBreakdown.map((p) => (
                <Fragment key={p.name}>
                  <dt className="text-muted-foreground">{p.name}</dt>
                  <dd className="text-right font-semibold">{formatMoney(p.total, currency)}</dd>
                </Fragment>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit &amp; Loss</CardTitle>
            <a href={`/api/reports/export?type=pnl&${qs}`}>
              <Button size="sm" variant="outline">
                <Download size={14} /> CSV
              </Button>
            </a>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Revenue</dt>
              <dd className="text-right font-semibold">{formatMoney(summary.revenue, currency)}</dd>
              <dt className="text-muted-foreground">Wages</dt>
              <dd className="text-right font-semibold">{formatMoney(summary.wages, currency)}</dd>
              <dt className="text-muted-foreground">Rent</dt>
              <dd className="text-right font-semibold">{formatMoney(summary.rent, currency)}</dd>
              <dt className="text-muted-foreground">Other Expenses</dt>
              <dd className="text-right font-semibold">{formatMoney(summary.otherExpenses, currency)}</dd>
              <dt className="text-muted-foreground">Total Expenses</dt>
              <dd className="text-right font-semibold">{formatMoney(summary.totalExpenses, currency)}</dd>
              <dt className="font-semibold text-foreground">Net Profit</dt>
              <dd className={`text-right font-bold ${summary.netProfit >= 0 ? "text-success" : "text-danger"}`}>
                {formatMoney(summary.netProfit, currency)}
              </dd>
              <dt className="text-muted-foreground">Profit Margin</dt>
              <dd className="text-right font-semibold">{summary.profitMargin.toFixed(1)}%</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Branch Report</CardTitle>
            <a href={`/api/reports/export?type=branch&${qs}`}>
              <Button size="sm" variant="outline">
                <Download size={14} /> CSV
              </Button>
            </a>
          </CardHeader>
          <CardContent>
            <Table>
              <Thead>
                <tr>
                  <Th>Branch</Th>
                  <Th className="text-right">Revenue</Th>
                </tr>
              </Thead>
              <Tbody>
                {salesByBranch.map((b) => (
                  <Tr key={b.branchId}>
                    <Td>{b.branchName}</Td>
                    <Td className="text-right font-semibold">{formatMoney(b.total, currency)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Worker Report</CardTitle>
          <a href={`/api/reports/export?type=worker&${qs}`}>
            <Button size="sm" variant="outline">
              <Download size={14} /> CSV
            </Button>
          </a>
        </CardHeader>
        <CardContent>
          <Table>
            <Thead>
              <tr>
                <Th>Worker</Th>
                <Th>Branch</Th>
                <Th className="text-right">Sales</Th>
                <Th className="text-right">Transactions</Th>
                <Th className="text-right">Avg Transaction</Th>
              </tr>
            </Thead>
            <Tbody>
              {salesByWorker.map((w) => (
                <Tr key={w.workerId}>
                  <Td>{w.name}</Td>
                  <Td className="text-muted-foreground">{w.branchName}</Td>
                  <Td className="text-right font-semibold">{formatMoney(w.total, currency)}</Td>
                  <Td className="text-right">{w.count}</Td>
                  <Td className="text-right">{formatMoney(w.avg, currency)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
