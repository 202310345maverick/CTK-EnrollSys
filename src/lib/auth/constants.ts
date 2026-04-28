function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export const SESSION_IDLE_TIMEOUT_MINUTES = parsePositiveInt(
  process.env.NEXT_PUBLIC_SESSION_IDLE_TIMEOUT_MINUTES,
  30
);
export const SESSION_MAX_AGE_SECONDS = SESSION_IDLE_TIMEOUT_MINUTES * 60;

export const MAX_FAILED_LOGIN_ATTEMPTS = parsePositiveInt(
  process.env.AUTH_MAX_FAILED_LOGIN_ATTEMPTS,
  5
);
export const ACCOUNT_LOCKOUT_MINUTES = parsePositiveInt(
  process.env.AUTH_LOCKOUT_MINUTES,
  15
);

export const PASSWORD_RESET_TOKEN_TTL_MINUTES = parsePositiveInt(
  process.env.AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES,
  60
);
export const EMAIL_VERIFICATION_TOKEN_TTL_MINUTES = parsePositiveInt(
  process.env.AUTH_EMAIL_VERIFICATION_TOKEN_TTL_MINUTES,
  24 * 60
);
