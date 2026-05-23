import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/jwt";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const isAdminPage    = pathname.startsWith("/admin");
  const isTeacherRoute = pathname.startsWith("/teacher");
  const is2FARoute     = pathname === "/verify";
  const isAuthApi      = pathname.startsWith("/api/auth");
  const isRootPage     = pathname === "/";

  let payload = null;
  try {
    const sessionCookie = request.cookies.get("session")?.value;
    if (sessionCookie) payload = await verifySessionToken(sessionCookie);
  } catch {
    // treat as unauthenticated
  }

  // Not logged in — only block admin/teacher, allow 2FA page through
  if (!payload) {
    if (isAdminPage || isTeacherRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Logged in but OTP not verified — force to 2FA page
  if (!payload.is2FAVerified && !is2FARoute && !isAuthApi) {
    return NextResponse.redirect(new URL("/verify", request.url));
  }

  // Fully logged in
  if (payload.is2FAVerified) {
    if (isRootPage) {
      const dest = payload.role === "admin" ? "/admin/dashboard" : "/teacher/classes";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    if (isAdminPage && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/teacher/classes", request.url));
    }
    if (isTeacherRoute && payload.role !== "teacher") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)"],
};
