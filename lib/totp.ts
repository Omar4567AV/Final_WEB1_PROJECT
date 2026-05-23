import { authenticator } from "otplib";

// توليد مفتاح سري عشوائي فريد لكل مستخدم عند إعداد الحساب لأول مرة
export function generate2FASecret() {
  return authenticator.generateSecret();
}

// توليد رابط الـ QR Code الذي يمسحه المستخدم بكاميرا الموبايل
export function get2FAQRCodeURI(email: string, secret: string) {
  return authenticator.keyuri(email, "EduManage ClaudeForce", secret);
}

// فحص الرمز المدخل من قبل المستخدم والتأكد من صحته (صالح لمدة 30 ثانية فقط)
export function verify2FAToken(token: string, secret: string): boolean {
  return authenticator.check(token, secret);
}
