import { cookies } from "next/headers";
import { signToken, verifyToken } from "@/lib/auth-utils";

const COOKIE_NAME = "session";

export interface SessionPayload {
  userId: string;
  email: string;
  is2FAVerified: boolean;
  expiresAt: Date;
}

export async function createSession(userId: string, email: string, is2FAVerified = false) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days
  
  const token = await signToken({ userId, email, is2FAVerified, expiresAt });
  
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!cookie) return null;

  try {
    const payload = await verifyToken(cookie) as unknown as SessionPayload;
    return payload;
  } catch (error) {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
