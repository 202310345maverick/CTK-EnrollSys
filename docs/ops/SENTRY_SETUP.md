# CTK EnrollSys — Sentry Error Monitoring Setup

## 1. Create a Sentry Project

1. Go to [sentry.io](https://sentry.io) → Create account (free tier is sufficient)
2. Create a new **Next.js** project
3. Copy your **DSN** from: Settings → Projects → your project → Client Keys (DSN)

---

## 2. Add Environment Variables

### Local development (`.env.local`)
```bash
# Sentry — leave blank or set to enable error reporting locally
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@oxxxxxxx.ingest.sentry.io/xxxxxxxx
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxx
SENTRY_ORG=your-sentry-org-slug
SENTRY_PROJECT=ctk-enrollsys
```

### Vercel Production
Add all four variables in: **Vercel Dashboard → Settings → Environment Variables**

- `NEXT_PUBLIC_SENTRY_DSN` — visible to browser (safe, contains no secrets)
- `SENTRY_AUTH_TOKEN` — for source map uploads during CI build (keep secret)
- `SENTRY_ORG` — your Sentry org slug
- `SENTRY_PROJECT` — your Sentry project slug

Get the auth token from: **Sentry → Settings → Developer Settings → Auth Tokens**  
Scopes needed: `project:releases`, `org:read`

---

## 3. What Gets Captured Automatically

With the current config, Sentry captures:

| Event | Source |
|-------|--------|
| Unhandled API route errors | Server-side |
| React component crashes | `global-error.tsx` |
| Uncaught JS exceptions | Client-side |
| Slow page loads (p95 > 1s) | Performance tracing |
| Session replays on error | Client-side |

---

## 4. Verify It's Working

After deploying with the DSN set, trigger a test error:

```bash
curl https://your-app.vercel.app/api/sentry-example-api
```

Or visit `/monitoring` in the browser — Sentry uses this as a tunnel route to bypass ad-blockers.

---

## 5. Alert Setup (Recommended)

In Sentry → Alerts → Create Alert Rule:

- **When:** An issue is first seen
- **Filter:** Environment = production
- **Action:** Send email to `ctkenrollsys@gmail.com`
- **Rate limit:** Once per 1 hour per issue

This ensures you're notified of new production errors without spam.
