"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/guards";
import { assertBranchOwnedByTenant, assertWorkerOwnedByTenant } from "@/lib/ownership";
import { writeAuditLog } from "@/lib/audit";

const markSchema = z.object({
  workerId: z.string().min(1),
  branchId: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(["FULL_DAY", "HALF_DAY", "ABSENT"]),
});

export async function markAttendanceAction(input: {
  workerId: string;
  branchId: string;
  date: string;
  status: "FULL_DAY" | "HALF_DAY" | "ABSENT";
}) {
  const session = await requireUserSession();
  const parsed = markSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid attendance data." };

  try {
    await assertBranchOwnedByTenant(parsed.data.branchId, session.tenantId);
    const worker = await assertWorkerOwnedByTenant(parsed.data.workerId, session.tenantId);
    if (worker.branchId && worker.branchId !== parsed.data.branchId) {
      return { error: "Worker does not belong to this branch." };
    }
  } catch {
    return { error: "Invalid worker or branch." };
  }

  const date = new Date(parsed.data.date);
  await prisma.attendance.upsert({
    where: { workerId_date: { workerId: parsed.data.workerId, date } },
    update: { status: parsed.data.status, branchId: parsed.data.branchId },
    create: {
      tenantId: session.tenantId,
      branchId: parsed.data.branchId,
      workerId: parsed.data.workerId,
      date,
      status: parsed.data.status,
    },
  });

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "ATTENDANCE_MARKED",
    entityType: "Attendance",
    entityId: parsed.data.workerId,
    metadata: { date: parsed.data.date, status: parsed.data.status },
  });

  revalidatePath("/wages");
  return { success: true };
}

export async function clearAttendanceAction(workerId: string, date: string) {
  const session = await requireUserSession();
  await assertWorkerOwnedByTenant(workerId, session.tenantId);

  await prisma.attendance.deleteMany({
    where: { tenantId: session.tenantId, workerId, date: new Date(date) },
  });

  await writeAuditLog({
    tenantId: session.tenantId,
    userId: session.userId,
    userEmail: session.email,
    action: "ATTENDANCE_CLEARED",
    entityType: "Attendance",
    entityId: workerId,
    metadata: { date },
  });

  revalidatePath("/wages");
}
