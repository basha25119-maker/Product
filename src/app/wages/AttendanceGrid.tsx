"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAttendanceAction, clearAttendanceAction } from "@/actions/attendance";
import { cn } from "@/lib/utils";

type Status = "FULL_DAY" | "HALF_DAY" | "ABSENT" | null;
type Worker = { id: string; firstName: string; lastName: string; branchId: string | null };

const CYCLE: Status[] = ["FULL_DAY", "HALF_DAY", "ABSENT", null];
const LABEL: Record<"FULL_DAY" | "HALF_DAY" | "ABSENT", string> = { FULL_DAY: "F", HALF_DAY: "H", ABSENT: "A" };
const STYLE: Record<"FULL_DAY" | "HALF_DAY" | "ABSENT", string> = {
  FULL_DAY: "bg-success/15 text-success hover:bg-success/25",
  HALF_DAY: "bg-warning/15 text-warning hover:bg-warning/25",
  ABSENT: "bg-danger/15 text-danger hover:bg-danger/25",
};

export function AttendanceGrid({
  workers,
  days,
  initial,
}: {
  workers: Worker[];
  days: string[];
  initial: Record<string, "FULL_DAY" | "HALF_DAY" | "ABSENT">;
}) {
  const [grid, setGrid] = useState<Record<string, Status>>(initial);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function cycle(worker: Worker, date: string) {
    if (!worker.branchId) return;
    const key = `${worker.id}|${date}`;
    const current = grid[key] ?? null;
    const idx = CYCLE.indexOf(current);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    setGrid((g) => ({ ...g, [key]: next }));
    startTransition(() => {
      const promise =
        next === null
          ? clearAttendanceAction(worker.id, date)
          : markAttendanceAction({ workerId: worker.id, branchId: worker.branchId!, date, status: next });
      // The payroll summary below is server-rendered from the same data,
      // so it needs an explicit refresh once the write lands — revalidatePath
      // alone only invalidates the cache, it doesn't re-render this page.
      Promise.resolve(promise).then(() => router.refresh());
    });
  }

  const unassigned = workers.filter((w) => !w.branchId);
  const assigned = workers.filter((w) => w.branchId);

  return (
    <div>
      <div className="overflow-x-auto scrollbar-thin rounded-xl border border-border">
        <table className="text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th className="sticky left-0 z-10 min-w-[140px] bg-muted/60 px-3 py-2 text-left">Worker</th>
              {days.map((d) => (
                <th key={d} className="px-1 py-2 text-center font-medium">
                  {Number(d.slice(-2))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assigned.map((w) => (
              <tr key={w.id}>
                <td className="sticky left-0 z-10 whitespace-nowrap bg-card px-3 py-1.5 font-medium">
                  {w.firstName} {w.lastName}
                </td>
                {days.map((d) => {
                  const status = grid[`${w.id}|${d}`] ?? null;
                  return (
                    <td key={d} className="px-0.5 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => cycle(w, d)}
                        className={cn(
                          "h-7 w-7 rounded text-xs font-semibold transition-colors",
                          status ? STYLE[status] : "bg-muted text-muted-foreground/30 hover:bg-muted/70"
                        )}
                        title={status ?? "Not marked — click to set"}
                      >
                        {status ? LABEL[status] : "·"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-wrap items-center gap-4 border-t border-border px-3 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-success/40" /> Full day
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-warning/40" /> Half day
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-danger/40" /> Absent
          </span>
          <span>Click a cell to cycle: Full → Half → Absent → Clear</span>
        </div>
      </div>
      {unassigned.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {unassigned.map((w) => `${w.firstName} ${w.lastName}`).join(", ")} — assign a branch in{" "}
          <a href="/workers" className="text-accent hover:underline">
            Workers
          </a>{" "}
          to track attendance.
        </p>
      )}
    </div>
  );
}
