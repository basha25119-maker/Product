"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSessionCookie, verifyPassword } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginState = { error?: string } | undefined;

export async function customerLoginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, include: { tenant: true } });
  if (!user) {
    return { error: "Invalid email or password." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  if (user.status !== "ACTIVE") {
    return { error: "Your account is not active. Contact your administrator." };
  }

  if (user.tenant.status === "SUSPENDED") {
    return { error: "This business account has been suspended. Please contact support." };
  }
  if (user.tenant.status === "INACTIVE") {
    return { error: "This business account is inactive. Please contact support." };
  }

  await createSessionCookie({
    type: "user",
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
  });

  await writeAuditLog({
    tenantId: user.tenantId,
    userId: user.id,
    userEmail: user.email,
    action: "LOGIN",
    entityType: "User",
    entityId: user.id,
  });

  if (user.mustResetPassword) {
    redirect("/settings?mustReset=1");
  }
  if (user.tenant.onboardingCompletedAt === null) {
    redirect("/onboarding");
  }
  redirect("/dashboard");
}

export async function adminLoginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }
  const { email, password } = parsed.data;

  const admin = await prisma.platformAdmin.findUnique({ where: { email: email.toLowerCase() } });
  if (!admin) {
    return { error: "Invalid email or password." };
  }
  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }
  if (admin.status !== "ACTIVE") {
    return { error: "This admin account is not active." };
  }

  await createSessionCookie({
    type: "admin",
    adminId: admin.id,
    role: admin.role,
    email: admin.email,
  });

  await writeAuditLog({
    action: "LOGIN",
    entityType: "PlatformAdmin",
    entityId: admin.id,
    userEmail: admin.email,
  });

  redirect("/admin");
}
