"use server";

import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { requireUserSession } from "@/lib/guards";
import { writeAuditLog } from "@/lib/audit";
import { redirect } from "next/navigation";

export type ActionState = { error?: string; success?: string; resetLink?: string } | undefined;

export async function requestPasswordResetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") || "").toLowerCase().trim();
  if (!email) return { error: "Enter your email address." };

  const user = await prisma.user.findUnique({ where: { email } });
  // Always respond the same way to avoid leaking which emails exist.
  const genericSuccess = { success: "If that email exists, a reset link has been generated." };
  if (!user) return genericSuccess;

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: new Date(Date.now() + 1000 * 60 * 60) },
  });

  await writeAuditLog({
    tenantId: user.tenantId,
    userId: user.id,
    userEmail: user.email,
    action: "PASSWORD_RESET_REQUESTED",
    entityType: "User",
    entityId: user.id,
  });

  // No transactional email provider is configured yet (see README "Email").
  // Until one is wired up, the link is surfaced directly so the flow is usable in dev/testing.
  return { ...genericSuccess, resetLink: `/reset-password/${token}` };
}

const resetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirm: z.string(),
});

export async function resetPasswordAction(
  token: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = resetSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  if (parsed.data.password !== parsed.data.confirm) return { error: "Passwords do not match." };

  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return { error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null, mustResetPassword: false },
  });

  await writeAuditLog({
    tenantId: user.tenantId,
    userId: user.id,
    userEmail: user.email,
    action: "PASSWORD_CHANGED",
    entityType: "User",
    entityId: user.id,
  });

  redirect("/login");
}

const changeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
  confirm: z.string(),
});

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireUserSession();
  const parsed = changeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  if (parsed.data.newPassword !== parsed.data.confirm) return { error: "New passwords do not match." };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return { error: "User not found." };

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { error: "Current password is incorrect." };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  await writeAuditLog({
    tenantId: user.tenantId,
    userId: user.id,
    userEmail: user.email,
    action: "PASSWORD_CHANGED",
    entityType: "User",
    entityId: user.id,
  });

  return { success: "Password updated successfully." };
}
