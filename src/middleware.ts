import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { middlewareRedirect } from "@/lib/redirect";

const SESSION_COOKIE = "bbm_session";

async function verify(token: string | undefined) {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { type?: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verify(token);

  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/sales") ||
    pathname.startsWith("/workers") ||
    pathname.startsWith("/branches") ||
    pathname.startsWith("/wages") ||
    pathname.startsWith("/rent") ||
    pathname.startsWith("/expenses") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/onboarding");

  if (isAdminRoute && session?.type !== "admin") {
    return middlewareRedirect(req, "/admin/login");
  }

  if (isDashboardRoute && session?.type !== "user") {
    return middlewareRedirect(req, "/login");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/sales/:path*",
    "/workers/:path*",
    "/branches/:path*",
    "/wages/:path*",
    "/rent/:path*",
    "/expenses/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
};
