import { NextRequest, NextResponse } from "next/server";
import { verifyStepUpToken, signSessionToken } from "@/lib/jwt";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { code?: unknown };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { code } = body;

  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "A valid 6-digit code is required." }, { status: 400 });
  }

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
      { error: "Verification session expired. Please log in again." },
      { status: 401 }
    );
  }

  // OTP is inside the signed JWT — compare directly
  if (stepUp.otp !== code) {
    return NextResponse.json(
      { error: "Invalid or expired code. Check your email and try again." },
      { status: 401 }
    );
  }

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
