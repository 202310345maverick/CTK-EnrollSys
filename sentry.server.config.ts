import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Capture all server-side transactions in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  enabled: process.env.NODE_ENV === "production" || process.env.SENTRY_ENABLED === "true",

  // Scrub sensitive fields from error reports
  beforeSend(event) {
    if (event.request?.cookies) delete event.request.cookies;
    if (event.request?.headers?.cookie) delete event.request.headers.cookie;
    return event;
  },
});
