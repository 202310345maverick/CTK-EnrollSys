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
