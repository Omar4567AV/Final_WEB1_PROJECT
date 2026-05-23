import { NextRequest, NextResponse } from "next/server";
import { signSessionToken, signStepUpToken } from "@/lib/jwt";
import { sendOTPEmail } from "@/lib/email";

interface User {
  id: string;
  email: string;
  password: string;
  role: "admin" | "teacher";
  name: string;
  has2FA: boolean;
}

const USERS: User[] = [
  {
    id: "usr_admin_01",
    email: "fawazhalabi71739709@gmail.com",
    password: "123",
    role: "admin",
    name: "Fawaz Halabi",
    has2FA: true,
  },
  {
    id: "usr_teacher_01",
    email: "ohalabi68@gmail.com",
    password: "123",
    role: "teacher",
    name: "Omar Halabi",
    has2FA: false,
  },
  {
    id: "usr_teacher_02",
    email: "teacher2@university.edu",
    password: "Teacher@2024",
    role: "teacher",
    name: "Second Teacher",
    has2FA: true,
  },
];

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { email?: unknown; password?: unknown };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, password } = body;

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  await new Promise((r) => setTimeout(r, 80 + Math.random() * 40));

  const user = USERS.find((u) => u.email === email && u.password === password);

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  // 2FA — generate OTP, embed in step_up JWT, send email
  if (user.has2FA) {
    const otp = generateOTP();

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

    // OTP is stored inside the signed JWT — no in-memory store needed
    const stepUpToken = await signStepUpToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phase: "awaiting-2fa",
      otp,
    });

    const res = NextResponse.json({ requires2FA: true }, { status: 200 });
    res.cookies.set("step_up", stepUpToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 5 * 60,
      path: "/",
    });
    return res;
  }

  // No 2FA — grant session immediately
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
