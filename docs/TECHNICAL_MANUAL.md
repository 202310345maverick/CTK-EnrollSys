# CTK EnrollSys — Technical Manual

Purpose: Technical reference for developers, operators, and maintainers of CTK EnrollSys.

[Figures]

## Table of Contents
- Overview
- Architecture
- Tech Stack
- Project Structure
- Setup & Development
- Environment Variables
- Database
- Authentication
- API & Services
- File Storage
- Testing
- Deployment
- Troubleshooting

## Overview
CTK EnrollSys is a Next.js 14 + TypeScript app that digitizes student enrollment and records management. The system uses MongoDB Atlas for persistence and Cloudinary for file storage.

[Figures]

## Architecture
Client (Next.js) → Vercel Edge → Next.js App (Pages / App Router & API routes) → Services → MongoDB Atlas / Cloudinary / SMTP

[Figures]

## Tech Stack
- Framework: Next.js 14
- Language: TypeScript
- Database: MongoDB Atlas (Mongoose)
- Auth: NextAuth.js
- File Uploads: Cloudinary
- Email: Nodemailer (SMTP)
- Styling: Tailwind CSS, shadcn/ui
- Deployment: Vercel

## Project Structure (key folders)
- src/app — App Router pages & API routes
- src/components — UI components (ui/, forms/, shared/)
- src/models — Mongoose models
- src/services — Business logic and domain services
- src/lib/db — Database utilities
- src/validations — Zod schemas
- scripts/seed.ts — Initial seed commands

See README.md for full tree.

## Setup & Development
1. Prerequisites: Node.js 18+, npm, MongoDB Atlas, Cloudinary account.
2. Clone repo and install dependencies:

```
git clone <repo>
cd ctk-enrollsys
npm install
```

3. Create env file: `cp .env.example .env.local` and populate required values.
4. Seed (optional): `npm run seed` (runs `npx tsx scripts/seed.ts`).
5. Run dev server: `npm run dev` → open http://localhost:3000

[Figures]

## Environment Variables (high level)
See `.env.local` for full list. Required examples:
- NEXT_PUBLIC_APP_URL, NEXTAUTH_URL, NEXTAUTH_SECRET
- MONGODB_URI
- CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET
- SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS

[Figures]

## Database
Collections: users, students, enrollments, payments, schoolYears, feeStructures, documents, auditLogs, notifications.
Refer to docs/DATABASE_SCHEMA.md for detailed field definitions.

## Authentication
Auth is implemented with NextAuth.js. A default admin account is created on first run (change password immediately). Configure NEXTAUTH_SECRET and session timeouts.

[Figures]

## API & Services
- API routes live under `src/app/api` (see route files for request/response shapes).
- Business logic in `src/services` (enrollment, student, payment, auth).
- Models defined under `src/models` using Mongoose.

Example endpoints (informational):
- `GET /api/enrollments` — list enrollments (auth required)
- `POST /api/enrollments` — submit new enrollment (parents)
- `POST /api/auth/*` — authentication flows

[Figures]

## File Storage
Uploads go to Cloudinary. Ensure Cloudinary credentials are set and upload presets (if used) are configured.

## Testing & Linting
- Run unit tests: `npm run test`
- Coverage: `npm run test:coverage`
- Lint: `npm run lint`

## Deployment
Recommended: Vercel (connect GitHub, set env vars, deploy). Ensure MongoDB URI and Cloudinary credentials are set in Vercel Dashboard.

[Figures]

## Troubleshooting
- "Cannot connect to MongoDB": verify MONGODB_URI, whitelist IPs or use SRV string.
- Upload failures: check Cloudinary keys and file size limits.
- Email issues: verify SMTP credentials and port.
- Seed data not created: run `npm run seed` and check logs.

## Maintenance
- Backup MongoDB regularly.
- Rotate NEXTAUTH_SECRET and SMTP credentials periodically.
- Monitor logs (Sentry integration is present).

---

Maintainer: Maverick Lance Coronel

[Figures]
