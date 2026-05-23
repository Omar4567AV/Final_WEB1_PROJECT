import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOTPEmail(to: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from: `"EduManage Security" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your EduManage login code",
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b;margin-bottom:8px">EduManage Login Verification</h2>
        <p style="color:#475569;margin-bottom:20px">Use the code below to complete your sign-in.</p>
        <div style="font-size:40px;font-weight:700;letter-spacing:10px;color:#1e293b;
                    padding:20px;background:#f1f5f9;border-radius:10px;text-align:center">
          ${otp}
        </div>
        <p style="color:#94a3b8;font-size:13px;margin-top:20px">
          This code expires in <strong>5 minutes</strong> and can only be used once.<br>
          If you did not request this, ignore this email.
        </p>
      </div>
    `,
  });
}
