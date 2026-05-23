# CTK EnrollSys — Technical Manual

Version: 1.0.0
Last updated: 2026-05-23

Purpose: Comprehensive technical reference for developers, operators, and maintainers of CTK EnrollSys. This document covers architecture, development setup, data model, API reference, deployment, monitoring, and runbooks for common operational tasks.

[Figures]

## Table of Contents
- Overview
- System Architecture
- Component Details
- Data Model & Database
- API Reference (selected endpoints)
- Authentication & Authorization
- File Uploads & Storage
- Local Development & Tooling
- Testing Strategy
- Deployment (Vercel)
- Observability & Monitoring
- Backup, Maintenance & Runbooks
- Troubleshooting
- Contributing & Coding Standards
- Appendix: Useful commands

## Overview
CTK EnrollSys is a full-stack Next.js 14 (App Router) + TypeScript application that digitizes school enrollment and student records. The app uses MongoDB Atlas for persistence, Cloudinary for media, NextAuth for authentication, and is optimized for Vercel deployment.

High-level flow:
- Parent submits enrollment (web form + documents) → enrollment stored in `enrollments` collection and files in Cloudinary → Registrar reviews/approves → approved enrollment becomes a `student` record; payment records stored in `payments` collection.

[Figures]

## System Architecture
```
   Browser (React + App) 
        │
        ▼
   Vercel Edge Network ──> Next.js App (App Router + API routes)
        │
        ▼
   Services layer (src/services): auth, enrollment, student, payment
        │
        ├─> MongoDB Atlas (users, students, enrollments, payments, documents)
        ├─> Cloudinary (file storage)
        └─> SMTP / Nodemailer (email notifications)
```
[Figures]

### Component Responsibilities
- Next.js (App Router): UI pages, server components, and API routes for JSON endpoints.
- src/services: Business logic, validation, fee calculations, data transformations.
- src/models: Mongoose schemas & models; central source of truth for data shapes.
- src/lib/db: Connection handling, retry logic, connection pooling.
- Cloudinary: stores document images and PDF uploads; signed URLs used for private access.
- Sentry: error monitoring (client/server configured via @sentry/nextjs).

## Data Model & Database
Primary collections:
- users { _id, name, email, role, passwordHash, isActive, createdAt }
- students { _id, studentId, firstName, lastName, dob, gradeLevel, guardian, enrollments: [enrollmentId], createdAt }
- enrollments { _id, externalId, parentId, studentDetails, documents: [{type, url, publicId}], status, assignedRegistrar, notes, createdAt }
- payments { _id, enrollmentId, studentId, amount, method, reference, recordedBy, createdAt }
- documents { _id, ownerId, type, cloudinaryPublicId, url, size, mimeType, uploadedAt }
- auditLogs { _id, actorId, action, targetId, diff, createdAt }

Indexes:
- users.email (unique)
- students.studentId (unique)
- enrollments.externalId (unique)
- payments.enrollmentId

Refer to docs/DATABASE_SCHEMA.md for field-level details and sample documents.

[Figures]

## API Reference (selected endpoints)
Notes: API routes are under `src/app/api/*`. All authenticated endpoints require a session cookie (NextAuth) or bearer token depending on configuration. Use a dev token for local testing where applicable.

1) Submit Enrollment
- POST /api/enrollments
- Auth: optional (parents may submit without account if guest flows enabled)
- Request JSON sample:
```
{
  "student": {"firstName":"Juan","lastName":"Dela Cruz","dob":"2015-04-01"},
  "guardian": {"name":"Maria Dela Cruz","phone":"09171234567","email":"maria@example.com"},
  "schoolYear":"2026-2027",
  "documents": [{"type":"psa","url":"..."}]
}
```
- Response: 201 Created with enrollment id and status

2) List Enrollments (paginated)
- GET /api/enrollments?status=pending&page=1&limit=25
- Auth: Registrar or Admin
- Response: { data: [ ... ], meta: { total, page, limit } }

3) Approve Enrollment
- POST /api/enrollments/:id/approve
- Auth: Registrar
- Body: { assignedSection: "Grade 1 - A", notes: "" }
- Response: 200 OK (student record created)

4) Upload Document (signed direct-to-cloudinary)
- POST /api/documents (server signed upload)
- Auth: Parent/Registrar
- Response: { publicId, url }

5) Payments
- POST /api/payments
- Auth: Registrar/Admin
- Body: { enrollmentId, amount, method, reference }

[Figures]

## Authentication & Authorization
- NextAuth.js used for session management. Configure NEXTAUTH_SECRET and NEXTAUTH_URL.
- Roles: admin, registrar, parent. Role checks enforced in `src/lib/permissions.ts` and via middleware in `src/middleware.ts` for route protection.

Role mapping (example):
- admin: full access
- registrar: manage enrollments & students, log payments
- parent: submit and view own enrollments

Example guard snippet (server-side):

```
import { getSession } from "next-auth/react";
export async function requireRole(req, role) {
  const session = await getSession({ req });
  if (!session || session.user.role !== role) throw new Error('Forbidden');
}
```

## File Uploads & Storage
- Cloudinary is configured via CLOUDINARY_* env vars. Upload via server or obtain a signed upload signature for direct uploads from browser.
- Accepted file types: jpg, jpeg, png, pdf. Max size: 10MB by default (configurable).
- Store metadata in `documents` collection with cloudinary publicId for deletion.

Security:
- For private documents use secure signed URLs and short-lived access tokens.

[Figures]

## Local Development & Tooling
1) Prereqs: Node 18+, npm, MongoDB Atlas or local MongoDB.
2) Install:
```
npm install
cp .env.example .env.local
# set MONGODB_URI to a dev cluster and CLOUDINARY keys
npm run dev
```
3) Seeding test data:
```
npm run seed
```
4) Useful scripts:
- `npm run dev` — start local Next.js
- `npm run build` — production build
- `npm run test` — run unit tests

[Figures]

## Testing Strategy
- Unit tests for services and utilities (Jest)
- Integration tests for API routes (supertest with test DB)
- E2E tests for critical flows (playwright/cypress optional)
- Mocks: cloudinary, smtp should be mocked in CI

Example unit test command:
```
npm run test -- src/services/enrollment.test.ts
```

## Deployment (Vercel)
- Connect GitHub repository to Vercel
- Set environment variables in Vercel dashboard (NEXTAUTH_SECRET, MONGODB_URI, CLOUDINARY keys, SMTP)
- Branches: main → production, develop → staging
- Protect production secrets and rotate keys regularly

Zero-downtime considerations:
- Use Atlas cluster with adequate tier and connection pooling
- Monitor build size and remove large unused packages

[Figures]

## Observability & Monitoring
- Sentry integrated for error capture (@sentry/nextjs). Configure DSN in env.
- Application logs: server logs are aggregated by Vercel; configure external logging if needed.
- Monitor: enrollments backlog, failed uploads, email bounce rates.

Runbook excerpts:
- If Sentry shows frequent crashes, check recent deployments and roll back.
- If uploads failing: check Cloudinary account usage, API limits, and credentials.

## Backup, Maintenance & Runbooks
Backup MongoDB:
- Use Atlas scheduled snapshots. For restore, follow Atlas restore UI.
- Export a collection with `mongodump` if needed.

Rotate keys:
- Update environment variables in Vercel and restart deployments
- Update Cloudinary API secret and reissue signed upload keys

Maintenance window steps:
1. Notify users
2. Put app in read-only mode (optional)
3. Run schema migrations if needed
4. Validate post-deploy behavior

[Figures]

## Troubleshooting (common issues)
- Cannot connect to MongoDB: check MONGODB_URI and IP allowlist
- Emails not sent: test SMTP credentials locally with `nodemailer` test script
- File upload returns 401: verify signed upload signature and CLOUDINARY_API_SECRET

## Contributing & Coding Standards
- Branch per feature; open PRs for review
- Run `npm run lint` and tests before pushing
- Commit messages: concise, reference issue IDs. When creating commits via this agent, include:

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>

## Appendix: Useful commands
- Install deps: `npm install`
- Run dev: `npm run dev`
- Seed data: `npm run seed`
- Run tests: `npm run test`
- Build: `npm run build`

---

Maintainer: Maverick Lance Coronel
Contact: maverick@example.com

[Figures]
