import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth-utils";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("session")?.value;
  const payload = verifyToken(sessionToken);

  const isAdminRoute = pathname.startsWith("/admin");
  const isTeacherRoute = pathname.startsWith("/teacher");
  const is2FARoute = pathname === "/auth/2fa";
  const isRootPage = pathname === "/";

  // 1. إذا لم يسجل دخول ويحاول دخول لوحات التحكم أو صفحة الـ 2FA
  if (!payload && (isAdminRoute || isTeacherRoute || is2FARoute)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (payload) {
    // 2. إذا سجل إيميل وباسورد ولكن لم يفعل الـ 2FA بعد، ندفعه لصفحة الـ 2FA حصراً
    if (!payload.is2FAVerified && !is2FARoute) {
      return NextResponse.redirect(new URL("/auth/2fa", request.url));
    }

    // 3. منع تداخل الصلاحيات للمستخدمين المحققين بالكامل
    if (payload.is2FAVerified) {
      if (is2FARoute || isRootPage) {
        const dest = payload.role === "admin" ? "/admin/dashboard" : "/teacher/classes";
        return NextResponse.redirect(new URL(dest, request.url));
      }
      if (isAdminRoute && payload.role !== "admin") {
        return NextResponse.redirect(new URL("/teacher/classes", request.url));
      }
      if (isTeacherRoute && payload.role !== "teacher") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
