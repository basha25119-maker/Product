"use server";

import { z } from "zod";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/guards";
import { hashPassword } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export type ActionState = { error?: string; success?: string; tempPassword?: string } | undefined;

const createCustomerSchema = z.object({
  businessName: z.string().min(1, "Business name is required."),
  ownerName: z.string().min(1, "Owner name is required."),
  email: z.string().email("Enter a valid email."),
  phone: z.string().optional(),
  plan: z.enum(["STARTER", "PROFESSIONAL", "BUSINESS"]),
});

function generateTempPassword() {
  return crypto.randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 12) + "!A1";
}

export async function createCustomerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdminSession();
  const parsed = createCustomerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) return { error: "A user with this email already exists." };

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const tenant = await prisma.tenant.create({
    data: {
      name: parsed.data.businessName,
      phone: parsed.data.phone || null,
      email: parsed.data.email.toLowerCase(),
      status: "ACTIVE",
      subscription: { create: { plan: parsed.data.plan, status: "TRIAL" } },
      users: {
        create: {
          email: parsed.data.email.toLowerCase(),
          name: parsed.data.ownerName,
          passwordHash,
          role: "OWNER",
          status: "ACTIVE",
          mustResetPassword: true,
        },
      },
      paymentMethods: {
        create: [
          { name: "Cash", isDefault: true },
          { name: "Card/Machine" },
        ],
      },
    },
  });

  await writeAuditLog({
    tenantId: tenant.id,
    userEmail: admin.email,
    action: "CUSTOMER_CREATED",
    entityType: "Tenant",
    entityId: tenant.id,
    metadata: { businessName: parsed.data.businessName },
  });

  revalidatePath("/admin/customers");
  return { success: "Customer account created.", tempPassword };
}

export async function setTenantStatusAction(tenantId: string, status: "ACTIVE" | "SUSPENDED" | "INACTIVE") {
  const admin = await requireAdminSession();
  await prisma.tenant.update({ where: { id: tenantId }, data: { status } });

  await writeAuditLog({
    tenantId,
    userEmail: admin.email,
    action: status === "ACTIVE" ? "CUSTOMER_REACTIVATED" : "CUSTOMER_SUSPENDED",
    entityType: "Tenant",
    entityId: tenantId,
    metadata: { status },
  });

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${tenantId}`);
}

export async function adminResetPasswordAction(userId: string): Promise<{ tempPassword: string }> {
  const admin = await requireAdminSession();
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustResetPassword: true },
  });

  await writeAuditLog({
    tenantId: user.tenantId,
    userEmail: admin.email,
    action: "PASSWORD_RESET_BY_ADMIN",
    entityType: "User",
    entityId: userId,
  });

  revalidatePath(`/admin/customers/${user.tenantId}`);
  return { tempPassword };
}

export async function adminLogoutRedirect() {
  redirect("/admin/login");
}
