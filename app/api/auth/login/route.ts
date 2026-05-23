import { NextRequest, NextResponse } from "next/server";
import { signSessionToken, signStepUpToken } from "@/lib/jwt";

// ─── Mock user store ──────────────────────────────────────────────────────────
// Replace with a real DB query (e.g. Prisma / D1) and bcrypt.compare() in production.

interface MockUser {
  id: string;
  email: string;
  passwordHash: string; // plaintext here only for demo
  role: "admin" | "teacher";
  name: string;
  has2FA: boolean;
  totpSecret: string;
}

const USERS: MockUser[] = [
  {
    id: "usr_admin_01",
    email: "admin@university.edu",
    passwordHash: "password123",
    role: "admin",
    name: "System Admin",
    has2FA: true,
    totpSecret: "KVKVE43VJB2F6ZDNLVRE2V2VKREUCU2K",
  },
  {
    id: "usr_teacher_01",
    email: "teacher@university.edu",
    passwordHash: "password123",
    role: "teacher",
    name: "Faculty Member",
    has2FA: true,
    totpSecret: "KVKVE43VJB2F6ZDNLVRE2V2VKREUCU2K",
  },
];

// ─── Route handler ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 *
 * Phase 1 of the two-phase login flow.
 *
 * On success with 2FA enabled  → 200 { requires2FA: true } + step_up cookie (5 min)
 * On success without 2FA       → 200 { success: true }     + session cookie (7 days)
 * On failure                   → 401 { error: string }
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

  // Simulate constant-time lookup to prevent user-enumeration via timing
  await new Promise((r) => setTimeout(r, 80 + Math.random() * 40));

  const user = USERS.find((u) => u.email === email && u.passwordHash === password);

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  // ── 2FA enabled: issue step-up token, stop here ──────────────────────────
  if (user.has2FA) {
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
