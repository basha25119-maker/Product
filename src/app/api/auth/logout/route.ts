import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
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
  return NextResponse.redirect(new URL("/login", req.url));
}
