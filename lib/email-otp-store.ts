interface OTPEntry {
  otp: string;
  expiresAt: number;
}

// In-memory store — fine for single-process dev/demo.
// Replace with Redis or a DB table for multi-instance production.
const store = new Map<string, OTPEntry>();

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOTP(userId: string, otp: string): void {
  store.set(userId, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
}

/** Returns true and deletes the entry on match; false on mismatch or expiry. */
export function verifyAndConsumeOTP(userId: string, submitted: string): boolean {
  const entry = store.get(userId);
  if (!entry) return false;

  if (Date.now() > entry.expiresAt) {
    store.delete(userId);
    return false;
  }

  if (entry.otp !== submitted) return false;

  store.delete(userId);
  return true;
}
