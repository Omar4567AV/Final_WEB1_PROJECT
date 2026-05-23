import { generateSecret, generateURI, verifySync } from "otplib";

export function generate2FASecret(): string {
  return generateSecret();
}

export function get2FAQRCodeURI(email: string, secret: string): string {
  return generateURI({
    issuer: "EduManage ClaudeForce",
    label: email,
    secret,
  });
}

export function verify2FAToken(token: string, secret: string): boolean {
  const result = verifySync({ token, secret });
  return result.valid;
}
