import { prisma } from "./prisma";
import { toNumber } from "./utils";

export type AttendanceStatusValue = "FULL_DAY" | "HALF_DAY" | "ABSENT";

/**
 * Attendance dates are always constructed from a plain "YYYY-MM-DD" string
 * via `new Date(dateISO)`, which per the ISO-8601 spec parses as UTC
 * midnight. Reading them back must use the matching UTC getters — mixing in
 * local-timezone getters here would shift "day 14" to "day 13" or "day 15"
 * depending on the server's timezone.
 */
export function toDateKey(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysInMonth(monthISO: string): string[] {
  const [y, m] = monthISO.split("-").map(Number);
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) => `${monthISO}-${String(i + 1).padStart(2, "0")}`);
}

export function monthRange(monthISO: string) {
  const [y, m] = monthISO.split("-").map(Number);
  return {
    from: new Date(Date.UTC(y, m - 1, 1)),
    to: new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)),
  };
}

/**
 * Sums attendance into a wage amount: a full day pays the worker's daily
 * rate, a half day pays half, an absence pays nothing. `dailyRate` is the
 * worker's `defaultWageAmount` — the "per day pay" the owner set for them.
 */
export function computePayFromCounts(dailyRate: number, fullDays: number, halfDays: number) {
  return dailyRate * fullDays + dailyRate * 0.5 * halfDays;
}

export async function computeWorkerPayForRange(tenantId: string, workerId: string, from: Date, to: Date) {
  const worker = await prisma.worker.findFirst({ where: { id: workerId, tenantId } });
  if (!worker) return null;

  const records = await prisma.attendance.findMany({
    where: { tenantId, workerId, date: { gte: from, lte: to } },
  });
  const fullDays = records.filter((r) => r.status === "FULL_DAY").length;
  const halfDays = records.filter((r) => r.status === "HALF_DAY").length;
  const absentDays = records.filter((r) => r.status === "ABSENT").length;
  const dailyRate = toNumber(worker.defaultWageAmount);

  return {
    worker,
    fullDays,
    halfDays,
    absentDays,
    dailyRate,
    amount: computePayFromCounts(dailyRate, fullDays, halfDays),
  };
}
