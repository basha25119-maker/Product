import { NextRequest, NextResponse } from "next/server";

/**
 * Redirect helpers that never send users to the server's internal address.
 *
 * Behind a reverse proxy (Railway, Vercel, nginx...) `req.url` carries the
 * server's internal host, so `new URL("/login", req.url)` redirected users to
 * http://localhost:<port>/login after logout.
 */

/**
 * For route handlers: a *relative* Location header. The browser resolves it
 * against the address it actually used, so it works on any host. Use 303
 * after a POST (so the browser follows with a GET).
 */
export function relativeRedirect(path: string, status: 303 | 307 = 307) {
  return new NextResponse(null, { status, headers: { Location: path } });
}

/**
 * For middleware: Next parses the Location header there with `new URL()`, so
 * a relative path throws. Build an absolute URL from the host and protocol
 * the browser used (forwarded by the proxy) instead of from `req.url`.
 */
export function middlewareRedirect(req: NextRequest, path: string) {
  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0].trim();
  const host = forwardedHost || req.headers.get("host") || req.nextUrl.host;
  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  const proto = forwardedProto || req.nextUrl.protocol.replace(":", "");
  return NextResponse.redirect(new URL(path, `${proto}://${host}`));
}
