import nodemailer from "nodemailer";

function getAppBaseUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL or NEXTAUTH_URL must be configured");
  }

  return appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl;
}

function parseSmtpPort(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 587;
  }
  return parsed;
}

function parseSmtpSecure(value: string | undefined, port: number): boolean {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return port === 465;
}

function getEmailConfig(): {
  transporter: nodemailer.Transporter;
  from: string;
} {
  const host = process.env.SMTP_HOST;
  const port = parseSmtpPort(process.env.SMTP_PORT);
  const secure = parseSmtpSecure(process.env.SMTP_SECURE, port);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;

  if (!host) {
    throw new Error("SMTP_HOST is not configured");
  }

  if (!user) {
    throw new Error("SMTP_USER is not configured");
  }

  if (!pass) {
    throw new Error("SMTP_PASS is not configured");
  }

  if (!from) {
    throw new Error("EMAIL_FROM is not configured");
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    }),
    from,
  };
}

export function assertAuthEmailConfig(): void {
  getAppBaseUrl();
  getEmailConfig();
}

export function buildResetPasswordUrl(token: string): string {
  return `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

export function buildVerifyEmailUrl(token: string): string {
  return `${getAppBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
  expiresInMinutes,
}: {
  email: string;
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}) {
  const { transporter, from } = getEmailConfig();

  await transporter.sendMail({
    from,
    to: email,
    subject: "Reset your CTK EnrollSys password",
    html: `
      <p>Hi ${name},</p>
      <p>We received a request to reset your CTK EnrollSys password.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link expires in ${expiresInMinutes} minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
    text: `Hi ${name},\n\nUse this link to reset your CTK EnrollSys password:\n${resetUrl}\n\nThis link expires in ${expiresInMinutes} minutes.\n\nIf you did not request this, you can ignore this email.`,
  });
}

export async function sendVerificationEmail({
  email,
  name,
  verificationUrl,
  expiresInMinutes,
}: {
  email: string;
  name: string;
  verificationUrl: string;
  expiresInMinutes: number;
}) {
  const { transporter, from } = getEmailConfig();
  const expiresInHours = Math.max(1, Math.ceil(expiresInMinutes / 60));

  await transporter.sendMail({
    from,
    to: email,
    subject: "Verify your CTK EnrollSys account",
    html: `
      <p>Hi ${name},</p>
      <p>Welcome to CTK EnrollSys. Please verify your email to activate your account.</p>
      <p><a href="${verificationUrl}">Verify my email</a></p>
      <p>This link expires in ${expiresInHours} hour(s).</p>
    `,
    text: `Hi ${name},\n\nWelcome to CTK EnrollSys. Verify your email to activate your account:\n${verificationUrl}\n\nThis link expires in ${expiresInHours} hour(s).`,
  });
}

function buildEmailHtml(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:#b4040d;padding:24px 32px;border-radius:8px 8px 0 0;">
          <p style="margin:0;color:#fff;font-size:20px;font-weight:bold;">Christ the King Catholic School</p>
          <p style="margin:4px 0 0;color:#ffd4d4;font-size:13px;">CTK EnrollSys</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#fff;padding:32px;">
          <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">${title}</h2>
          ${bodyContent}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8f8f8;padding:16px 32px;border-top:1px solid #e5e5e5;border-radius:0 0 8px 8px;">
          <p style="margin:0;color:#888;font-size:12px;text-align:center;">© 2024 Christ the King Catholic School. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendEnrollmentSubmittedEmail({
  email, name, enrollmentNumber, studentName, gradeLevel, enrollmentType,
}: {
  email: string; name: string; enrollmentNumber: string; studentName: string;
  gradeLevel: string; enrollmentType: string;
}): Promise<void> {
  try {
    const { transporter, from } = getEmailConfig();
    const body = `
      <p style="color:#333;line-height:1.6;">Dear <strong>${name}</strong>,</p>
      <p style="color:#333;line-height:1.6;">Your enrollment application has been successfully submitted and is now under review.</p>
      <table cellpadding="0" cellspacing="0" style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:6px;padding:16px;margin:16px 0;width:100%;">
        <tr><td style="padding:6px 12px;color:#555;font-size:14px;"><strong>Enrollment Number:</strong></td><td style="padding:6px 12px;color:#333;font-size:14px;">${enrollmentNumber}</td></tr>
        <tr><td style="padding:6px 12px;color:#555;font-size:14px;"><strong>Student Name:</strong></td><td style="padding:6px 12px;color:#333;font-size:14px;">${studentName}</td></tr>
        <tr><td style="padding:6px 12px;color:#555;font-size:14px;"><strong>Grade Level:</strong></td><td style="padding:6px 12px;color:#333;font-size:14px;">${gradeLevel}</td></tr>
        <tr><td style="padding:6px 12px;color:#555;font-size:14px;"><strong>Enrollment Type:</strong></td><td style="padding:6px 12px;color:#333;font-size:14px;text-transform:capitalize;">${enrollmentType}</td></tr>
      </table>
      <p style="color:#333;line-height:1.6;">Our registrar will review your application and you will be notified of any updates. You may log in to the CTK EnrollSys portal to track your application status.</p>
      <p style="color:#333;line-height:1.6;">If you have any questions, please don't hesitate to contact us.</p>
      <p style="color:#333;line-height:1.6;">God bless,<br><strong>Christ the King Catholic School</strong></p>
    `;
    await transporter.sendMail({
      from, to: email,
      subject: `Enrollment Submitted – ${enrollmentNumber} | CTK EnrollSys`,
      html: buildEmailHtml("Enrollment Application Submitted", body),
    });
  } catch (error) {
    console.error("[sendEnrollmentSubmittedEmail] Failed:", error);
  }
}

export async function sendStatusChangeEmail({
  email, name, enrollmentNumber, studentName, newStatus, remarks, link,
}: {
  email: string; name: string; enrollmentNumber: string; studentName: string;
  newStatus: string; remarks?: string; link?: string;
}): Promise<void> {
  try {
    const { transporter, from } = getEmailConfig();
    const statusColors: Record<string, string> = {
      approved: "#16a34a", rejected: "#dc2626", under_review: "#d97706",
      pending: "#6b7280", enrolled: "#2563eb",
    };
    const statusColor = statusColors[newStatus] ?? "#6b7280";
    const statusLabel = newStatus.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const body = `
      <p style="color:#333;line-height:1.6;">Dear <strong>${name}</strong>,</p>
      <p style="color:#333;line-height:1.6;">The status of your enrollment application has been updated.</p>
      <table cellpadding="0" cellspacing="0" style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:6px;padding:16px;margin:16px 0;width:100%;">
        <tr><td style="padding:6px 12px;color:#555;font-size:14px;"><strong>Enrollment Number:</strong></td><td style="padding:6px 12px;color:#333;font-size:14px;">${enrollmentNumber}</td></tr>
        <tr><td style="padding:6px 12px;color:#555;font-size:14px;"><strong>Student Name:</strong></td><td style="padding:6px 12px;color:#333;font-size:14px;">${studentName}</td></tr>
        <tr><td style="padding:6px 12px;color:#555;font-size:14px;"><strong>New Status:</strong></td><td style="padding:6px 12px;font-size:14px;font-weight:bold;color:${statusColor};">${statusLabel}</td></tr>
        ${remarks ? `<tr><td style="padding:6px 12px;color:#555;font-size:14px;"><strong>Remarks:</strong></td><td style="padding:6px 12px;color:#333;font-size:14px;">${remarks}</td></tr>` : ""}
      </table>
      ${link ? `<p style="color:#333;line-height:1.6;"><a href="${link}" style="background:#b4040d;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;font-weight:bold;">View Enrollment</a></p>` : ""}
      <p style="color:#333;line-height:1.6;">God bless,<br><strong>Christ the King Catholic School</strong></p>
    `;
    await transporter.sendMail({
      from, to: email,
      subject: `Enrollment Status Update – ${enrollmentNumber} | CTK EnrollSys`,
      html: buildEmailHtml(`Enrollment Status: ${statusLabel}`, body),
    });
  } catch (error) {
    console.error("[sendStatusChangeEmail] Failed:", error);
  }
}

export async function sendReuploadRequestEmail({
  email, name, studentName, documentType, remarks, link,
}: {
  email: string; name: string; studentName: string; documentType: string;
  remarks?: string; link?: string;
}): Promise<void> {
  try {
    const { transporter, from } = getEmailConfig();
    const body = `
      <p style="color:#333;line-height:1.6;">Dear <strong>${name}</strong>,</p>
      <p style="color:#333;line-height:1.6;">A document re-upload is required for <strong>${studentName}</strong>'s enrollment application.</p>
      <table cellpadding="0" cellspacing="0" style="background:#fff8e1;border:1px solid #ffc107;border-radius:6px;padding:16px;margin:16px 0;width:100%;">
        <tr><td style="padding:6px 12px;color:#555;font-size:14px;"><strong>Document Type:</strong></td><td style="padding:6px 12px;color:#333;font-size:14px;">${documentType}</td></tr>
        ${remarks ? `<tr><td style="padding:6px 12px;color:#555;font-size:14px;"><strong>Reason:</strong></td><td style="padding:6px 12px;color:#333;font-size:14px;">${remarks}</td></tr>` : ""}
      </table>
      <p style="color:#333;line-height:1.6;">Please log in to the CTK EnrollSys portal to upload the correct document at your earliest convenience.</p>
      ${link ? `<p style="color:#333;line-height:1.6;"><a href="${link}" style="background:#b4040d;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;font-weight:bold;">Upload Document</a></p>` : ""}
      <p style="color:#333;line-height:1.6;">God bless,<br><strong>Christ the King Catholic School</strong></p>
    `;
    await transporter.sendMail({
      from, to: email,
      subject: `Document Re-upload Required | CTK EnrollSys`,
      html: buildEmailHtml("Document Re-upload Required", body),
    });
  } catch (error) {
    console.error("[sendReuploadRequestEmail] Failed:", error);
  }
}

export async function sendPaymentConfirmationEmail({
  email, name, receiptNumber, studentName, amount, paymentDate,
}: {
  email: string; name: string; receiptNumber: string; studentName: string;
  amount: number; paymentDate: string;
}): Promise<void> {
  try {
    const { transporter, from } = getEmailConfig();
    const formattedAmount = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);
    const body = `
      <p style="color:#333;line-height:1.6;">Dear <strong>${name}</strong>,</p>
      <p style="color:#333;line-height:1.6;">We have received your payment. Please find the payment details below.</p>
      <table cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:16px;margin:16px 0;width:100%;">
        <tr><td style="padding:6px 12px;color:#555;font-size:14px;"><strong>Receipt Number:</strong></td><td style="padding:6px 12px;color:#333;font-size:14px;">${receiptNumber}</td></tr>
        <tr><td style="padding:6px 12px;color:#555;font-size:14px;"><strong>Student Name:</strong></td><td style="padding:6px 12px;color:#333;font-size:14px;">${studentName}</td></tr>
        <tr><td style="padding:6px 12px;color:#555;font-size:14px;"><strong>Amount:</strong></td><td style="padding:6px 12px;color:#16a34a;font-size:14px;font-weight:bold;">${formattedAmount}</td></tr>
        <tr><td style="padding:6px 12px;color:#555;font-size:14px;"><strong>Payment Date:</strong></td><td style="padding:6px 12px;color:#333;font-size:14px;">${paymentDate}</td></tr>
      </table>
      <p style="color:#333;line-height:1.6;">Please keep this as your official record. If you have any questions about your payment, please contact our finance office.</p>
      <p style="color:#333;line-height:1.6;">God bless,<br><strong>Christ the King Catholic School</strong></p>
    `;
    await transporter.sendMail({
      from, to: email,
      subject: `Payment Confirmed – ${receiptNumber} | CTK EnrollSys`,
      html: buildEmailHtml("Payment Confirmation", body),
    });
  } catch (error) {
    console.error("[sendPaymentConfirmationEmail] Failed:", error);
  }
}
