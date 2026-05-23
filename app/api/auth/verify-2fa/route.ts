import { NextRequest, NextResponse } from "next/server";
import { verifyStepUpToken, signSessionToken } from "@/lib/jwt";
import { verifyOTP } from "@/lib/otp";

// ─── Mock TOTP secret store ───────────────────────────────────────────────────
// In production: query your DB by userId (e.g. `await db.user.findUnique(...)`)

const TOTP_SECRETS: Record<string, string> = {
  usr_admin_01: "KVKVE43VJB2F6ZDNLVRE2V2VKREUCU2K",
  usr_teacher_01: "KVKVE43VJB2F6ZDNLVRE2V2VKREUCU2K",
};

// ─── Route handler ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/verify-2fa
 *
 * Phase 2 of the two-phase login flow.
 *
 * Reads the `step_up` httpOnly cookie (set by /api/auth/login),
 * verifies it is a valid, unexpired step-up JWT, then validates the
 * submitted 6-digit TOTP code against the user's stored secret.
 *
 * On success → 200 { success: true, redirectTo }
 *              + full `session` cookie (7 days)
 *              + `step_up` cookie cleared
 * On failure → 400 / 401 { error: string }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { code?: unknown };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { code } = body;

  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: "A valid 6-digit numeric OTP code is required." },
      { status: 400 }
    );
  }

  // ── Validate step-up token ────────────────────────────────────────────────
  const stepUpCookie = req.cookies.get("step_up")?.value;
  if (!stepUpCookie) {
    return NextResponse.json(
      { error: "Verification session not found. Please log in again." },
      { status: 401 }
    );
  }

  const stepUp = await verifyStepUpToken(stepUpCookie);
  if (!stepUp) {
    return NextResponse.json(
      { error: "Verification session expired or invalid. Please log in again." },
      { status: 401 }
    );
  }

  // ── Validate TOTP code ────────────────────────────────────────────────────
  const totpSecret = TOTP_SECRETS[stepUp.userId];
  if (!totpSecret) {
    return NextResponse.json(
      { error: "2FA is not configured for this account." },
      { status: 400 }
    );
  }

  const isValid = await verifyOTP(code, totpSecret);
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid or expired OTP code. Check your authenticator app." },
      { status: 401 }
    );
  }

  // ── Promote to full session ───────────────────────────────────────────────
  const sessionToken = await signSessionToken({
    userId: stepUp.userId,
    email: stepUp.email,
    role: stepUp.role,
    name: stepUp.name,
    is2FAVerified: true,
  });

  const redirectTo = stepUp.role === "admin" ? "/admin/dashboard" : "/teacher/classes";

  const res = NextResponse.json({ success: true, redirectTo }, { status: 200 });

  res.cookies.set("session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  res.cookies.delete("step_up");

  return res;
}
