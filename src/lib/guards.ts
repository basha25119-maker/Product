import { redirect } from "next/navigation";
import { getSession, SessionPayload } from "./auth";

/**
 * Every tenant-scoped page/action must go through this. It derives tenantId
 * from the signed server-side session cookie only — never from the URL,
 * query string, or request body.
 */
export async function requireUserSession() {
  const session = await getSession();
  if (!session || session.type !== "user") {
    redirect("/login");
  }
  return session as Extract<SessionPayload, { type: "user" }>;
}

export async function requireAdminSession() {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    redirect("/admin/login");
  }
  return session as Extract<SessionPayload, { type: "admin" }>;
}

/** For API route handlers, which can't call redirect(). */
export async function requireUserApi() {
  const session = await getSession();
  if (!session || session.type !== "user") {
    return null;
  }
  return session as Extract<SessionPayload, { type: "user" }>;
}

export async function requireAdminApi() {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return null;
  }
  return session as Extract<SessionPayload, { type: "admin" }>;
}
