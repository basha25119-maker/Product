import { clearSessionCookie } from "@/lib/auth";
import { relativeRedirect } from "@/lib/redirect";

export async function POST() {
  await clearSessionCookie();
  return relativeRedirect("/admin/login", 303);
}
