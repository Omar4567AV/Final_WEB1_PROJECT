import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/jwt";

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const isAdminPage    = pathname.startsWith("/admin");
  const isTeacherRoute = pathname.startsWith("/teacher");
  const is2FARoute     = pathname === "/auth/2fa";
  const isAuthApi      = pathname.startsWith("/api/auth");
  const isRootPage     = pathname === "/";

  let payload = null;

  try {
    const sessionCookie = request.cookies.get("session")?.value;
    if (sessionCookie) {
      payload = await verifySessionToken(sessionCookie);
    }
  } catch {
    // invalid token — treat as unauthenticated
  }

  // Not logged in
  if (!payload) {
    if (isAdminPage || isTeacherRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Logged in but OTP not done yet
  if (!payload.is2FAVerified && !is2FARoute && !isAuthApi) {
    return NextResponse.redirect(new URL("/auth/2fa", request.url));
  }

  // Fully logged in
  if (payload.is2FAVerified) {
    if (is2FARoute || isRootPage) {
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
