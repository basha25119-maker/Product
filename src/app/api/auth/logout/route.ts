import { clearSessionCookie, getSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { relativeRedirect } from "@/lib/redirect";

export async function POST() {
  const session = await getSession();
  if (session?.type === "user") {
    await writeAuditLog({
      tenantId: session.tenantId,
      userId: session.userId,
      userEmail: session.email,
      action: "LOGOUT",
      entityType: "User",
      entityId: session.userId,
    });
  }
  await clearSessionCookie();
  return relativeRedirect("/login", 303);
}
