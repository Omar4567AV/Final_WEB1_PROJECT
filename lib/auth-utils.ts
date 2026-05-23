import { createHmac, timingSafeEqual } from "crypto";

export interface SessionPayload {
  userId: string;
  role: 'admin' | 'teacher';
  name: string;
  email: string;
  is2FAVerified: boolean; // حقل أساسي لمنع الدخول قبل كتابة الـ OTP
}

const SECRET = process.env.SESSION_SECRET || "fallback-super-secret-dev-key-minimum-32-chars";

export function signToken(payload: SessionPayload): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=+$/, "");
  const stringifiedPayload = btoa(JSON.stringify(payload)).replace(/=+$/, "");
  
  const signature = createHmac("sha256", SECRET)
    .update(`${header}.${stringifiedPayload}`)
    .digest("base64url");

  return `${header}.${stringifiedPayload}.${signature}`;
}

export function verifyToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, stringifiedPayload, signature] = parts;
  const expectedSignature = createHmac("sha256", SECRET).update(`${header}.${stringifiedPayload}`).digest("base64url");

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;

  try {
    return JSON.parse(atob(stringifiedPayload)) as SessionPayload;
  } catch {
    return null;
  }
}
