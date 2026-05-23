import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/jwt";

/**
 * Edge Middleware — runs on every matched request before it reaches a route.
 *
 * Responsibilities:
 *  1. Decode and verify the `session` JWT (jose — Edge-compatible).
 *  2. Enforce the two-phase 2FA gate: redirect to /auth/2fa until verified.
 *  3. RBAC: block role cross-access for /admin/* and /teacher/* routes.
 *  4. Protect /api/admin/* — return 403 JSON instead of redirecting.
 *  5. Attach defensive security headers on every response.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session")?.value;
  const payload = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  // ── Route classification ─────────────────────────────────────────────────
  const isAdminPage    = pathname.startsWith("/admin");
  const isAdminApi     = pathname.startsWith("/api/admin");
  const isTeacherRoute = pathname.startsWith("/teacher");
  const is2FARoute     = pathname === "/auth/2fa";
  const isAuthApi      = pathname.startsWith("/api/auth");
  const isRootPage     = pathname === "/";

  // ── Unauthenticated requests ─────────────────────────────────────────────
  if (!payload) {
    // API admin routes → 403 JSON (do not expose redirect patterns to bots)
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    // Protected pages → redirect to login
    if (isAdminPage || isTeacherRoute || is2FARoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // ── 2FA gate: token exists but OTP not yet confirmed ────────────────────
  if (!payload.is2FAVerified && !is2FARoute && !isAuthApi) {
    return NextResponse.redirect(new URL("/auth/2fa", request.url));
  }

  // ── Fully authenticated ──────────────────────────────────────────────────
  if (payload.is2FAVerified) {
    // Prevent re-entering login / 2FA pages
    if (is2FARoute || isRootPage) {
      const dest = payload.role === "admin" ? "/admin/dashboard" : "/teacher/classes";
      return NextResponse.redirect(new URL(dest, request.url));
    }

    // RBAC enforcement for page routes
    if (isAdminPage && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/teacher/classes", request.url));
    }
    if (isTeacherRoute && payload.role !== "teacher") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    // RBAC enforcement for admin API routes
    if (isAdminApi && payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // Signal to Cloudflare that this route should not be cached
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = {
  // Exclude static assets and image optimization from middleware
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)"],
};
