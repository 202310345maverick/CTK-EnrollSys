import crypto from "crypto";

export function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function buildTokenExpiry(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function createSecureToken(minutes: number): {
  rawToken: string;
  hashedToken: string;
  expiresAt: Date;
} {
  const rawToken = generateRawToken();

  return {
    rawToken,
    hashedToken: hashToken(rawToken),
    expiresAt: buildTokenExpiry(minutes),
  };
}
