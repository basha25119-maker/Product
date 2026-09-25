"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/guards";

export async function completeOnboardingAction() {
  const session = await requireUserSession();
  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { onboardingCompletedAt: new Date(), onboardingStep: 6 },
  });
  redirect("/dashboard");
}

export async function skipOnboardingAction() {
  const session = await requireUserSession();
  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { onboardingCompletedAt: new Date() },
  });
  redirect("/dashboard");
}
