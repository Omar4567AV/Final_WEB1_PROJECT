/**
 * RFC 6238 TOTP using the Web Crypto API.
 * Zero Node.js dependencies — runs on Cloudflare Edge Workers and browsers.
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;
const DIGITS = 6;

// ─── Internal helpers ─────────────────────────────────────────────────────────

function base32Decode(input: string): Uint8Array {
  const cleaned = input.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error(`Invalid base32 character: ${char}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

function counterToBytes(counter: number): Uint8Array {
  const buf = new Uint8Array(8);
  let n = counter;
  for (let i = 7; i >= 0; i--) {
    buf[i] = n & 0xff;
    n = Math.floor(n / 256);
  }
  return buf;
}

async function hotp(keyBytes: Uint8Array, counter: number): Promise<string> {
  // Copy into plain ArrayBuffer — Web Crypto rejects Uint8Array<ArrayBufferLike>
  const keyBuf = new ArrayBuffer(keyBytes.length);
  new Uint8Array(keyBuf).set(keyBytes);
  const counterBytes = counterToBytes(counter);
  const dataBuf = new ArrayBuffer(counterBytes.length);
  new Uint8Array(dataBuf).set(counterBytes);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const mac = new Uint8Array(
    await crypto.subtle.sign("HMAC", cryptoKey, dataBuf)
  );

  const offset = mac[mac.length - 1] & 0x0f;
  const code =
    ((mac[offset] & 0x7f) << 24) |
    ((mac[offset + 1] & 0xff) << 16) |
    ((mac[offset + 2] & 0xff) << 8) |
    (mac[offset + 3] & 0xff);

  return String(code % 10 ** DIGITS).padStart(DIGITS, "0");
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Verify a 6-digit TOTP token against a base32-encoded secret.
 * `window` allows ±N 30-second steps to compensate for clock skew.
 */
export async function verifyOTP(
  token: string,
  secret: string,
  window = 1
): Promise<boolean> {
  if (!/^\d{6}$/.test(token)) return false;
  const keyBytes = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / STEP_SECONDS);

  for (let delta = -window; delta <= window; delta++) {
    if ((await hotp(keyBytes, counter + delta)) === token) return true;
  }
  return false;
}

/**
 * Generate a random base32 TOTP secret suitable for user enrollment.
 */
export function generateTOTPSecret(byteLength = 20): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes)
    .map((b) => BASE32_ALPHABET[b % 32])
    .join("");
}

/**
 * Build an otpauth:// URI for QR-code enrollment in authenticator apps.
 */
export function buildOTPAuthURI(
  email: string,
  secret: string,
  issuer = "EduManage"
): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?${params}`;
}
