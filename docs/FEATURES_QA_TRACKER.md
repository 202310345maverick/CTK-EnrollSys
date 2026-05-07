# CTK EnrollSys Feature Checklist + QA Tracker

## Purpose

This document is the single source of truth for:

1. The full feature set the system should include
2. QA testing checklist and release gates
3. Day-to-day progress tracking

Use this during development, testing, and deployment review.

---

## How To Use

1. Set each feature row status as one of: Not Started, In Progress, Blocked, Done
2. Assign an owner and target date per feature
3. Link test execution to the QA checklist and test IDs in [docs/TESTING_SCENARIOS.md](docs/TESTING_SCENARIOS.md)
4. Update the Work Tracking section at the end of each day

---

## A. Master Feature Checklist

### A1. Authentication and Access Control

| ID | Feature | Priority | Status | Owner | Target Date | Notes |
|---|---|---|---|---|---|---|
| AUTH-001 | Parent registration | Must | Done |  |  | API and UI available |
| AUTH-002 | Login with role-based redirect | Must | Done |  |  | Parent/Registrar/Admin routing |
| AUTH-003 | Forgot password request | Must | Done |  |  | API + page + reset email flow implemented |
| AUTH-004 | Password reset completion | Must | Done |  |  | Token validation endpoint and reset page flow implemented |
| AUTH-005 | Session timeout enforcement | Must | Done |  |  | Idle timer auto-logs out authenticated users |
| AUTH-006 | Account lockout after failed attempts | Should | Done |  |  | Temporary lockout enforced after repeated failed logins |
| AUTH-007 | Email verification on signup | Should | Done |  |  | Parent signup now requires email verification before login |
| AUTH-008 | Role guard on pages and APIs | Must | Done |  |  | Middleware and API checks |

### A2. Parent Portal

| ID | Feature | Priority | Status | Owner | Target Date | Notes |
|---|---|---|---|---|---|---|
| PAR-001 | Parent dashboard with enrollment summary | Must | Done |  |  | Live summary, draft resume, and latest status surface on dashboard |
| PAR-002 | Multi-step enrollment form | Must | Done |  |  | Full wizard flow with step validation and submission |
| PAR-003 | Enrollment types: new, returning, transferee | Must | Done |  |  | Returning prefill and transferee rules are implemented |
| PAR-004 | Save draft enrollment | Should | Done |  |  | Draft save and resume flow available |
| PAR-005 | Document upload inside enrollment flow | Must | Done |  |  | Uploads are wired into the enrollment wizard |
| PAR-006 | Document checklist and upload status | Must | Done |  |  | Parent checklist reflects live upload state |
| PAR-007 | Submit enrollment with validation | Must | Done |  |  | Validation and create flow available |
| PAR-008 | View all enrollments and statuses | Must | Done |  |  | Parent list page available |
| PAR-009 | Delete pending enrollment | Should | Done |  |  | API supports deletion |
| PAR-010 | View children list | Must | Done |  |  | Child list page available |
| PAR-011 | View child detail profile | Must | Done |  |  | Detail page available |
| PAR-012 | Parent payment history | Must | Done |  |  | Live balances and payment transactions are wired |
| PAR-013 | Enrollment status timeline with remarks | Should | Done |  |  | Timeline and remarks are shown in enrollment detail |

### A3. Registrar Portal

| ID | Feature | Priority | Status | Owner | Target Date | Notes |
|---|---|---|---|---|---|---|
| REG-001 | Registrar dashboard with queue metrics | Must | Done |  |  | Live KPI metrics, recent queue, today's stats |
| REG-002 | Enrollment queue with filtering/search | Must | Done |  |  | Filter by status, grade, type, date; search by name/number |
| REG-003 | Enrollment detail review screen | Must | Done |  |  | Detail page available |
| REG-004 | Update enrollment status | Must | Done |  |  | Pending, under review, approved, rejected |
| REG-005 | Add review notes/remarks | Must | Done |  |  | Notes persist via PUT endpoint and shown in detail view |
| REG-006 | Request document re-upload | Must | Done |  |  | Re-upload modal in registrar detail, sends email and in-app notification |
| REG-007 | Verify uploaded documents | Must | Done |  |  | Per-document verify/reject buttons; syncs Document.verificationStatus |
| REG-008 | Assess fees during review | Must | Done |  |  | Fee assessment UI with breakdown, saved to enrollment |
| REG-009 | Student records page | Must | Done |  |  | Live search by name/LRN, filter by grade and status |
| REG-010 | Payment logging form | Must | Done |  |  | Full logging form with student search, void support |
| REG-011 | Payment list and filters | Must | Done |  |  | Filterable payment list with stats |
| REG-012 | Registrar reports page | Must | Done |  |  | All 7 report types with PDF and Excel export |

### A4. Admin Portal

| ID | Feature | Priority | Status | Owner | Target Date | Notes |
|---|---|---|---|---|---|---|
| ADM-001 | Admin dashboard with system KPIs | Must | Done |  |  | Live KPIs: users, students, enrollments, payments, today stats |
| ADM-002 | User management list/search/filter | Must | Done |  |  | API and UI available |
| ADM-003 | Create user accounts | Must | Done |  |  | Admin API available |
| ADM-004 | Update user profile and role | Must | Done |  |  | Full edit with audit log |
| ADM-005 | Deactivate/reactivate users | Must | Done |  |  | Toggle active state via PATCH with audit log |
| ADM-006 | School year management | Must | Done |  |  | Full CRUD with enrollment period dates |
| ADM-007 | Enrollment period control | Must | Done |  |  | Open/close toggle on admin dashboard via EnrollmentPeriodControl |
| ADM-008 | Fee structure management CRUD | Must | Done |  |  | Create, edit, delete for all grade levels with audit log |
| ADM-009 | Settings management | Should | Done |  |  | School info, security, registration toggle, doc requirements |
| ADM-010 | Audit log viewer | Should | Done |  |  | Filterable paginated log with action/resource/date filters |
| ADM-011 | Admin reports with exports | Must | Done |  |  | Same report engine as registrar, accessible by admin |

### A5. Core Academic and Data Management

| ID | Feature | Priority | Status | Owner | Target Date | Notes |
|---|---|---|---|---|---|---|
| CORE-001 | Student master record schema | Must | Done |  |  | Rich model available |
| CORE-002 | Student search by name/LRN/student ID | Must | Done |  |  | Search works across registrar and admin student pages |
| CORE-003 | Student status lifecycle | Should | Not Started |  |  | Active/inactive/graduated/transferred workflow |
| CORE-004 | Enrollment number generation | Must | Done |  |  | Generated during create |
| CORE-005 | Status history tracking | Must | Done |  |  | Timeline shown in enrollment detail for both parent and registrar |
| CORE-006 | Duplicate LRN prevention | Must | Done |  |  | API validates uniqueness; check-lrn endpoint available |
| CORE-007 | Enrollment type-specific rules | Must | Done |  |  | getRequiredDocumentTypes() enforced on submission and UI |

### A6. Document and File Management

| ID | Feature | Priority | Status | Owner | Target Date | Notes |
|---|---|---|---|---|---|---|
| DOC-001 | File upload endpoint | Must | Done |  |  | Accepts PDF/JPG/PNG with size checks |
| DOC-002 | Required docs by enrollment type | Must | Not Started |  |  | Rule engine needed |
| DOC-003 | Upload progress and retry UI | Should | Not Started |  |  | Better parent experience |
| DOC-004 | Document type tagging | Must | Done |  |  | Type set on upload; labels shown throughout UI |
| DOC-005 | Document verification status | Must | Done |  |  | Verify/reject per doc; syncs enrollment.documents and Document.verificationStatus |
| DOC-006 | Safe access control for documents | Must | Done |  |  | Auth proxy endpoint; parents only access own docs |
| DOC-007 | Cloud storage integration | Should | Not Started |  |  | Optional if moving off local uploads |

### A7. Fees, Billing, and Payments

| ID | Feature | Priority | Status | Owner | Target Date | Notes |
|---|---|---|---|---|---|---|
| PAY-001 | Fee structure schema | Must | Done |  |  | Model exists |
| PAY-002 | Fee structure CRUD | Must | Done |  |  | Create, edit, delete for all grades Nursery-Grade12 with audit log |
| PAY-003 | Auto-assess fees on approval | Must | Not Started |  |  | Core enrollment-to-payment flow |
| PAY-004 | Manual payment recording | Must | Done |  |  | API endpoint available |
| PAY-005 | Multiple payment methods | Must | Done |  |  | Cash/check/bank/gcash support in model/API |
| PAY-006 | Payment receipt number generation | Must | Done |  |  | Auto-generated |
| PAY-007 | Remaining balance computation | Must | Not Started |  |  | Needed for parent and registrar views |
| PAY-008 | Payment void and reversal | Should | In Progress |  |  | API logic exists, UI and safeguards pending |
| PAY-009 | Payment summary and collection report | Must | Not Started |  |  | Required for finance tracking |

### A8. Reports and Exports

| ID | Feature | Priority | Status | Owner | Target Date | Notes |
|---|---|---|---|---|---|---|
| RPT-001 | Enrollment summary report | Must | Done |  |  | Live with filters |
| RPT-002 | DepEd SF1 generation | Must | Done |  |  | PDF via jspdf-autotable |
| RPT-003 | DepEd SF2 generation | Should | Done |  |  | Attendance grid PDF |
| RPT-004 | Payment collection report | Must | Done |  |  | KPIs + by-type breakdown |
| RPT-005 | Export to Excel | Must | Done |  |  | All report types via SheetJS |
| RPT-006 | Export to PDF | Must | Done |  |  | All report types via jsPDF |
| RPT-007 | Report filters (date, grade, status) | Must | Done |  |  | Full filter panel |

### A9. Notifications and Communication

| ID | Feature | Priority | Status | Owner | Target Date | Notes |
|---|---|---|---|---|---|---|
| NOTIF-001 | In-app notification center | Should | Done |  |  | Bell icon in dashboard layout, unread count badge |
| NOTIF-002 | Enrollment submitted confirmation | Must | Done |  |  | Email sent on enrollment submission |
| NOTIF-003 | Enrollment status change notice | Must | Done |  |  | Email + in-app on status change |
| NOTIF-004 | Re-upload request notice | Must | Done |  |  | Email + in-app when doc rejected/re-upload requested |
| NOTIF-005 | Payment posted confirmation | Should | Done |  |  | Email + in-app on payment recorded |
| NOTIF-006 | Email provider integration | Must | Done |  |  | Gmail SMTP via nodemailer, configured in env |

### A10. Audit, Security, and Platform Reliability

| ID | Feature | Priority | Status | Owner | Target Date | Notes |
|---|---|---|---|---|---|---|
| SEC-001 | Audit log write on key actions | Must | Done |  |  | All key routes log to AuditLog model including login |
| SEC-002 | Audit log admin viewer | Should | Done |  |  | Paginated, filterable log in Admin portal |
| SEC-003 | Parent data isolation | Must | In Progress |  |  | Maintain strict per-parent filtering |
| SEC-004 | Input validation and sanitization | Must | In Progress |  |  | Continue across all endpoints |
| SEC-005 | File upload validation hardening | Must | In Progress |  |  | MIME, extension, and size checks |
| SEC-006 | API error and activity monitoring | Should | Not Started |  |  | Production observability |
| SEC-007 | Backup and restore procedure | Must | Not Started |  |  | Disaster recovery readiness |
| SEC-008 | Performance baseline under load | Should | Not Started |  |  | Peak enrollment readiness |

---

## B. QA Testing Checklist

Reference scenarios in [docs/TESTING_SCENARIOS.md](docs/TESTING_SCENARIOS.md).

### B1. Test Environment Readiness

- [ ] Test database seeded with users, students, enrollments, and payments
- [ ] Test accounts verified for admin, registrar, and parent roles
- [ ] File upload storage path available and writable
- [ ] Email provider configured for staging environment
- [ ] School year and fee structures configured
- [ ] Browser matrix prepared (Chrome, Firefox, Safari, mobile)

### B2. Smoke Test (Run Every Build)

- [ ] AUTH-01 Successful login
- [ ] AUTH-02 Failed login handling
- [ ] ENR-01 New enrollment submission
- [ ] ENR-04 Valid document upload
- [ ] ENR-08 Registrar status update
- [ ] PAY-01 Cash payment logging
- [ ] SR-01 Student search by name
- [ ] SEC-01 Role-based access enforcement
- [ ] INT-01 Database connection health

### B3. Full Functional Regression

- [ ] Authentication scenarios (AUTH-01 to AUTH-08)
- [ ] Enrollment scenarios (ENR-01 to ENR-10)
- [ ] Payment scenarios (PAY-01 to PAY-06)
- [ ] Reports scenarios (RPT-01 to RPT-06)
- [ ] User management scenarios (USR-01 to USR-05)

### B4. Security and Reliability Pass

- [ ] SEC-01 to SEC-10 completed
- [ ] PERF-01 to PERF-07 completed
- [ ] Upload security and access-control checks passed
- [ ] Parent isolation checks passed
- [ ] Session and authorization checks passed

### B5. UAT and Release Gates

- [ ] Registrar UAT sign-off
- [ ] Admin UAT sign-off
- [ ] Parent representative UAT sign-off
- [ ] Critical defects resolved
- [ ] High defects accepted or fixed
- [ ] Release note prepared
- [ ] Deployment checklist completed

### B6. QA Execution Log Template

| Date | Build/Commit | Tester | Scope | Passed | Failed | Blocked | Defect IDs | Notes |
|---|---|---|---|---:|---:|---:|---|---|
|  |  |  | Smoke/Regression/UAT |  |  |  |  |  |

---

## C. Work Tracking Checklist (What I Am Doing)

### C1. Daily Start Checklist

- [ ] Review open defects and blockers
- [ ] Review yesterday incomplete items
- [ ] Pick top 3 priorities for today
- [ ] Confirm owner and due date for each item
- [ ] Align QA scope for today

### C2. Daily End Checklist

- [ ] Update feature statuses in Section A
- [ ] Record tests executed in Section B6
- [ ] Log blockers with owner and next action
- [ ] Confirm tomorrow first task
- [ ] Post summary to project channel/group

### C3. Active Task Board

| Task ID | Module | Task | Status | Owner | Start Date | Due Date | Blocker | Next Action |
|---|---|---|---|---|---|---|---|---|
|  |  |  | Not Started/In Progress/Blocked/Done |  |  |  |  |  |

### C4. Weekly Progress Snapshot

| Week | Planned Items | Completed | In Progress | Blocked | QA Pass Rate | Notes |
|---|---:|---:|---:|---:|---:|---|
| YYYY-W## | 0 | 0 | 0 | 0 | 0% |  |

### C5. Blocker Log

| Date | Blocker | Impact | Owner | Mitigation | ETA |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

---

## D. Recommended Delivery Order

1. Finish parent enrollment flow end-to-end (including document uploads)
2. Complete registrar review tools (verify docs, request re-upload, fee assessment)
3. Complete payment UI and remaining balance logic
4. Implement notifications for status and payment events
5. Implement report generation and exports
6. Add audit logs and admin monitoring tools
7. Finalize performance hardening and release readiness

---

## E. Status Legend

- Not Started: Work has not begun
- In Progress: Work has started but not complete
- Blocked: Work cannot continue due to dependency/issue
- Done: Feature completed, tested, and accepted

---

## Last Updated

- Date: 2026-04-30
- Updated By: Project Team
