import { NextRequest, NextResponse } from "next/server";
import { signSessionToken, signStepUpToken } from "@/lib/jwt";
import { generateOTP, storeOTP } from "@/lib/email-otp-store";
import { sendOTPEmail } from "@/lib/email";

export const runtime = "nodejs";

interface MockUser {
  id: string;
  email: string;
  passwordHash: string;
  role: "admin" | "teacher";
  name: string;
  has2FA: boolean;
}

const USERS: MockUser[] = [
  {
    id: "usr_admin_01",
    email: "fawazhalabi71739709@gmail.com",
    passwordHash: "123",
    role: "admin",
    name: "Fawaz Halabi",
    has2FA: true,
  },
  {
    id: "usr_teacher_01",
    email: "ohalabi68@gmail.com",
    passwordHash: "123",
    role: "teacher",
    name: "Omar Halabi",
    has2FA: false,
  },
  {
    id: "usr_teacher_02",
    email: "teacher2@university.edu",
    passwordHash: "Teacher@2024",
    role: "teacher",
    name: "Second Teacher",
    has2FA: true,
  },
];

/**
 * POST /api/auth/login
 *
 * Phase 1: verify password → send OTP to user's email → return step_up cookie.
 *
 * On success with 2FA  → 200 { requires2FA: true } + step_up cookie (5 min)
 * On success no 2FA    → 200 { success: true }     + session cookie (7 days)
 * On failure           → 401 { error: string }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { email?: unknown; password?: unknown };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { email, password } = body;

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  // Constant-time-ish delay to prevent user enumeration via timing
  await new Promise((r) => setTimeout(r, 80 + Math.random() * 40));

  const user = USERS.find((u) => u.email === email && u.passwordHash === password);

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  // ── 2FA: generate OTP, email it, issue step-up cookie ───────────────────
  if (user.has2FA) {
    const otp = generateOTP();
    storeOTP(user.id, otp);

    try {
      await sendOTPEmail(user.email, otp);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Failed to send OTP email:", message);
      return NextResponse.json(
        { error: `Could not send verification email: ${message}` },
        { status: 500 }
      );
    }

    const stepUpToken = await signStepUpToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phase: "awaiting-2fa",
    });

    const res = NextResponse.json({ requires2FA: true }, { status: 200 });
    res.cookies.set("step_up", stepUpToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 5 * 60,
      path: "/api/auth/verify-2fa",
    });
    return res;
  }

  // ── No 2FA: grant full session immediately ───────────────────────────────
  const sessionToken = await signSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    is2FAVerified: false,
  });

  const res = NextResponse.json(
    { success: true, redirectTo: user.role === "admin" ? "/admin/dashboard" : "/teacher/classes" },
    { status: 200 }
  );
  res.cookies.set("session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}
