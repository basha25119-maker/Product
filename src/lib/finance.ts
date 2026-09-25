import { prisma } from "./prisma";
import { toNumber } from "./utils";
import { subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";

export type DateRange = { from?: Date; to?: Date };

export type DashboardFilters = {
  tenantId: string;
  branchId?: string;
  workerId?: string;
  from?: Date;
  to?: Date;
};

function dateWhere(from?: Date, to?: Date) {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: startOfDay(from) } : {}),
    ...(to ? { lte: endOfDay(to) } : {}),
  };
}

export async function getFinancialSummary(filters: DashboardFilters) {
  const { tenantId, branchId, workerId, from, to } = filters;
  const dateFilter = dateWhere(from, to);

  const saleWhere = {
    tenantId,
    deletedAt: null,
    ...(branchId ? { branchId } : {}),
    ...(workerId ? { workerId } : {}),
    ...(dateFilter ? { date: dateFilter } : {}),
  };
  const wageWhere = {
    tenantId,
    deletedAt: null,
    ...(branchId ? { branchId } : {}),
    ...(workerId ? { workerId } : {}),
    ...(dateFilter ? { date: dateFilter } : {}),
  };
  const rentWhere = {
    tenantId,
    deletedAt: null,
    ...(branchId ? { branchId } : {}),
    ...(dateFilter ? { date: dateFilter } : {}),
  };
  const expenseWhere = {
    tenantId,
    deletedAt: null,
    ...(branchId ? { branchId } : {}),
    ...(dateFilter ? { date: dateFilter } : {}),
  };

  const [salesAgg, wagesAgg, rentAgg, expensesAgg] = await Promise.all([
    prisma.sale.aggregate({ where: saleWhere, _sum: { amount: true }, _count: true, _avg: { amount: true } }),
    prisma.wagePayment.aggregate({ where: wageWhere, _sum: { amount: true } }),
    prisma.rentPayment.aggregate({ where: rentWhere, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: expenseWhere, _sum: { amount: true } }),
  ]);

  const revenue = toNumber(salesAgg._sum.amount);
  const wages = toNumber(wagesAgg._sum.amount);
  const rent = toNumber(rentAgg._sum.amount);
  const otherExpenses = toNumber(expensesAgg._sum.amount);
  const totalExpenses = wages + rent + otherExpenses;
  const netProfit = revenue - totalExpenses;

  return {
    revenue,
    wages,
    rent,
    otherExpenses,
    totalExpenses,
    netProfit,
    transactionCount: salesAgg._count,
    avgTransaction: toNumber(salesAgg._avg.amount),
    profitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
  };
}

export async function getSalesByBranch(filters: DashboardFilters) {
  const { tenantId, workerId, from, to } = filters;
  const dateFilter = dateWhere(from, to);
  const sales = await prisma.sale.groupBy({
    by: ["branchId"],
    where: {
      tenantId,
      deletedAt: null,
      ...(workerId ? { workerId } : {}),
      ...(dateFilter ? { date: dateFilter } : {}),
    },
    _sum: { amount: true },
  });
  const branches = await prisma.branch.findMany({ where: { tenantId }, select: { id: true, name: true } });
  const branchMap = new Map(branches.map((b) => [b.id, b.name]));
  return sales
    .map((s) => ({ branchId: s.branchId, branchName: branchMap.get(s.branchId) ?? "Unknown", total: toNumber(s._sum.amount) }))
    .sort((a, b) => b.total - a.total);
}

export async function getSalesByWorker(filters: DashboardFilters) {
  const { tenantId, branchId, from, to } = filters;
  const dateFilter = dateWhere(from, to);
  const sales = await prisma.sale.groupBy({
    by: ["workerId"],
    where: {
      tenantId,
      deletedAt: null,
      ...(branchId ? { branchId } : {}),
      ...(dateFilter ? { date: dateFilter } : {}),
    },
    _sum: { amount: true },
    _count: true,
    _avg: { amount: true },
  });
  const workers = await prisma.worker.findMany({
    where: { tenantId },
    select: { id: true, firstName: true, lastName: true, displayName: true, branchId: true, branch: { select: { name: true } } },
  });
  const workerMap = new Map(workers.map((w) => [w.id, w]));
  return sales
    .map((s) => {
      const w = workerMap.get(s.workerId);
      return {
        workerId: s.workerId,
        name: w?.displayName || `${w?.firstName ?? ""} ${w?.lastName ?? ""}`.trim() || "Unknown",
        branchName: w?.branch?.name ?? "-",
        total: toNumber(s._sum.amount),
        count: s._count,
        avg: toNumber(s._avg.amount),
      };
    })
    .sort((a, b) => b.total - a.total);
}

export async function getPaymentMethodBreakdown(filters: DashboardFilters) {
  const { tenantId, branchId, workerId, from, to } = filters;
  const dateFilter = dateWhere(from, to);
  const sales = await prisma.sale.groupBy({
    by: ["paymentMethodId"],
    where: {
      tenantId,
      deletedAt: null,
      ...(branchId ? { branchId } : {}),
      ...(workerId ? { workerId } : {}),
      ...(dateFilter ? { date: dateFilter } : {}),
    },
    _sum: { amount: true },
  });
  const methods = await prisma.paymentMethod.findMany({ where: { tenantId }, select: { id: true, name: true } });
  const map = new Map(methods.map((m) => [m.id, m.name]));
  return sales
    .map((s) => ({ name: map.get(s.paymentMethodId) ?? "Unknown", total: toNumber(s._sum.amount) }))
    .sort((a, b) => b.total - a.total);
}

export async function getSixMonthProfitLoss(tenantId: string, branchId?: string) {
  const months: { label: string; from: Date; to: Date }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i);
    months.push({ label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }), from: startOfMonth(d), to: endOfMonth(d) });
  }

  const results = await Promise.all(
    months.map(async (m) => {
      const summary = await getFinancialSummary({ tenantId, branchId, from: m.from, to: m.to });
      return { month: m.label, ...summary };
    })
  );
  return results;
}
