import { requireUserSession } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { FiltersBar } from "./FiltersBar";
import { SixMonthChart, RevenueExpenseBar, CashCardPie } from "./Charts";
import {
  getFinancialSummary,
  getSalesByBranch,
  getSalesByWorker,
  getPaymentMethodBreakdown,
  getSixMonthProfitLoss,
} from "@/lib/finance";
import { resolveRange } from "@/lib/date-range";
import { formatMoney } from "@/lib/utils";
import { Banknote, TrendingDown, Wallet, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { branch?: string; range?: string };
}) {
  const session = await requireUserSession();
  const [user, tenant] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
  ]);
  const branches = await prisma.branch.findMany({ where: { tenantId: session.tenantId }, orderBy: { name: "asc" } });

  const { from, to } = resolveRange(searchParams.range);
  const filters = { tenantId: session.tenantId, branchId: searchParams.branch, from, to };

  const [summary, salesByBranch, salesByWorker, paymentBreakdown, sixMonth] = await Promise.all([
    getFinancialSummary(filters),
    getSalesByBranch(filters),
    getSalesByWorker(filters),
    getPaymentMethodBreakdown(filters),
    getSixMonthProfitLoss(session.tenantId, searchParams.branch),
  ]);

  const currency = tenant?.currency ?? "GBP";

  return (
    <DashboardShell businessName={tenant?.name ?? "Your Business"} userEmail={user?.email ?? ""}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {user?.name?.split(" ")[0]}.</p>
        </div>
        <FiltersBar branches={branches} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/sales/new">
          <Button size="sm">
            <Plus size={15} /> Add Sale
          </Button>
        </Link>
        <Link href="/wages/new">
          <Button size="sm" variant="outline">
            <Plus size={15} /> Add Wage
          </Button>
        </Link>
        <Link href="/expenses/new">
          <Button size="sm" variant="outline">
            <Plus size={15} /> Add Expense
          </Button>
        </Link>
        <Link href="/rent/new">
          <Button size="sm" variant="outline">
            <Plus size={15} /> Add Rent
          </Button>
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Revenue" value={formatMoney(summary.revenue, currency)} icon={Banknote} />
        <StatCard label="Expenses" value={formatMoney(summary.totalExpenses, currency)} icon={TrendingDown} />
        <StatCard label="Wages" value={formatMoney(summary.wages, currency)} icon={Wallet} />
        <StatCard label="Rent" value={formatMoney(summary.rent, currency)} icon={Wallet} />
        <StatCard
          label="Net Profit"
          value={formatMoney(summary.netProfit, currency)}
          icon={TrendingUp}
          tone={summary.netProfit >= 0 ? "positive" : "negative"}
          hint={`${summary.profitMargin.toFixed(1)}% margin`}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>6 Month Profit / Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <SixMonthChart data={sixMonth} currency={currency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses by Branch</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueExpenseBar
              data={salesByBranch.map((b) => ({ label: b.branchName, revenue: b.total, expenses: 0 }))}
              currency={currency}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Sales by Branch</CardTitle>
          </CardHeader>
          <CardContent>
            {salesByBranch.length === 0 && <p className="text-sm text-muted-foreground">No sales yet.</p>}
            <ul className="space-y-2">
              {salesByBranch.map((b) => (
                <li key={b.branchId} className="flex items-center justify-between text-sm">
                  <span className="text-foreground/80">{b.branchName}</span>
                  <span className="font-semibold">{formatMoney(b.total, currency)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sales by Worker</CardTitle>
          </CardHeader>
          <CardContent>
            {salesByWorker.length === 0 && <p className="text-sm text-muted-foreground">No sales yet.</p>}
            <ul className="space-y-2">
              {salesByWorker.slice(0, 8).map((w) => (
                <li key={w.workerId} className="flex items-center justify-between text-sm">
                  <span className="text-foreground/80">
                    {w.name} <span className="text-xs text-muted-foreground">· {w.branchName}</span>
                  </span>
                  <span className="font-semibold">{formatMoney(w.total, currency)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cash vs Card</CardTitle>
          </CardHeader>
          <CardContent>
            <CashCardPie data={paymentBreakdown} currency={currency} />
            <ul className="mt-2 space-y-1">
              {paymentBreakdown.map((p) => (
                <li key={p.name} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{p.name}</span>
                  <span className="font-medium">{formatMoney(p.total, currency)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
