import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-dev-secret-minimum-32-chars-change-in-prod"
);

// ─── Payload shapes ───────────────────────────────────────────────────────────

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  role: "admin" | "teacher";
  name: string;
  is2FAVerified: boolean;
}

export interface StepUpPayload extends JWTPayload {
  userId: string;
  email: string;
  role: "admin" | "teacher";
  name: string;
  phase: "awaiting-2fa";
  otp: string;
}

// ─── Sign helpers ─────────────────────────────────────────────────────────────

export async function signSessionToken(
  payload: Omit<SessionPayload, keyof JWTPayload>
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

/**
 * Short-lived (5 min) token issued after password is verified but before
 * the TOTP code is confirmed. Scoped to the /api/auth/verify-2fa path only.
 */
export async function signStepUpToken(
  payload: Omit<StepUpPayload, keyof JWTPayload>
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secret);
}

// ─── Verify helpers ───────────────────────────────────────────────────────────

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function verifyStepUpToken(token: string): Promise<StepUpPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.phase !== "awaiting-2fa") return null;
    return payload as StepUpPayload;
  } catch {
    return null;
  }
}
