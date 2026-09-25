import { NextRequest, NextResponse } from "next/server";
import { requireUserApi } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { resolveRange } from "@/lib/date-range";
import { getFinancialSummary, getSalesByBranch, getSalesByWorker } from "@/lib/finance";
import { toNumber } from "@/lib/utils";

function toCsv(rows: (string | number)[][]) {
  return rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export async function GET(req: NextRequest) {
  const session = await requireUserApi();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "sales";
  const branchId = searchParams.get("branch") ?? undefined;
  const { from, to } = resolveRange(searchParams.get("range") ?? undefined);

  // Every query below is scoped by session.tenantId, never by a client-supplied tenant/business id.
  const filters = { tenantId: session.tenantId, branchId, from, to };

  let rows: (string | number)[][] = [];
  let filename = "report.csv";

  if (type === "sales") {
    const sales = await prisma.sale.findMany({
      where: {
        tenantId: session.tenantId,
        deletedAt: null,
        ...(branchId ? { branchId } : {}),
        ...(from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      },
      include: { branch: true, worker: true, paymentMethod: true },
      orderBy: { date: "desc" },
    });
    rows = [
      ["Date", "Branch", "Worker", "Payment Method", "Amount", "Reference"],
      ...sales.map((s) => [
        s.date.toISOString().slice(0, 10),
        s.branch.name,
        `${s.worker.firstName} ${s.worker.lastName}`,
        s.paymentMethod.name,
        toNumber(s.amount),
        s.reference ?? "",
      ]),
    ];
    filename = "sales-report.csv";
  } else if (type === "pnl") {
    const s = await getFinancialSummary(filters);
    rows = [
      ["Metric", "Amount"],
      ["Revenue", s.revenue],
      ["Wages", s.wages],
      ["Rent", s.rent],
      ["Other Expenses", s.otherExpenses],
      ["Total Expenses", s.totalExpenses],
      ["Net Profit", s.netProfit],
      ["Profit Margin %", s.profitMargin.toFixed(2)],
    ];
    filename = "profit-loss-report.csv";
  } else if (type === "branch") {
    const data = await getSalesByBranch(filters);
    rows = [["Branch", "Revenue"], ...data.map((b) => [b.branchName, b.total])];
    filename = "branch-report.csv";
  } else if (type === "worker") {
    const data = await getSalesByWorker(filters);
    rows = [
      ["Worker", "Branch", "Sales", "Transactions", "Average Transaction"],
      ...data.map((w) => [w.name, w.branchName, w.total, w.count, w.avg]),
    ];
    filename = "worker-report.csv";
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
