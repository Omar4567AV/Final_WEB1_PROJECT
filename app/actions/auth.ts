'use server'

import { redirect } from "next/navigation";
import { createSession, deleteSession, getSession } from "@/app/lib/session";
import { verify2FAToken } from "@/lib/totp";
import { SessionPayload } from "@/lib/auth-utils";

// مفتاح تجريبي ثابت (في الحقيقة يُخزن في قاعدة البيانات لكل مستخدم)
const MOCK_2FA_SECRET = "KVKVE43VJB2F6ZDNLVRE2V2VKREUCU2K"; 

export async function login(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const roleInput = formData.get("role") as string;

  if (!email || !password) return { error: "Please enter your academic credentials." };

  let sessionData: SessionPayload | null = null;

  if (email === "admin@university.edu" && password === "password123" && roleInput === "admin") {
    sessionData = { userId: "usr_admin", role: "admin", name: "System Admin", email, is2FAVerified: false };
  } else if (email === "teacher@university.edu" && password === "password123" && roleInput === "teacher") {
    sessionData = { userId: "usr_teacher", role: "teacher", name: "Faculty Member", email, is2FAVerified: false };
  }

  if (!sessionData) return { error: "Invalid credentials." };

  // إنشاء جلسة مؤقتة (لم يتجاوز الـ 2FA بعد)
  await createSession(sessionData);
  redirect("/auth/2fa"); // تحويله فوراً لصفحة الـ OTP
}

export async function verifyOTPAction(prevState: any, formData: FormData) {
  const otp = formData.get("otp") as string;
  const session = await getSession();

  if (!session) return { error: "Session expired. Please log in again." };

  // فحص كود الـ OTP المكتوب
  const isValid = verify2FAToken(otp, MOCK_2FA_SECRET);

  if (!isValid) return { error: "Invalid or expired OTP code. Please check your authenticator app." };

  // تحديث الجلسة لتصبح محققة بالكامل
  session.is2FAVerified = true;
  await createSession(session);

  if (session.role === "admin") {
    redirect("/admin/dashboard");
  } else {
    redirect("/teacher/classes");
  }
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
