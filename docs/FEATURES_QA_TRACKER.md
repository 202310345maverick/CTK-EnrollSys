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
| REG-001 | Registrar dashboard with queue metrics | Must | In Progress |  |  | Dashboard mostly static |
| REG-002 | Enrollment queue with filtering/search | Must | In Progress |  |  | Basic list exists |
| REG-003 | Enrollment detail review screen | Must | Done |  |  | Detail page available |
| REG-004 | Update enrollment status | Must | Done |  |  | Pending, under review, approved, rejected |
| REG-005 | Add review notes/remarks | Must | In Progress |  |  | Field exists; ensure persistence and visibility |
| REG-006 | Request document re-upload | Must | Not Started |  |  | Needed for incomplete/invalid documents |
| REG-007 | Verify uploaded documents | Must | Not Started |  |  | Per-document verification workflow |
| REG-008 | Assess fees during review | Must | Not Started |  |  | Connect fee structures to approval flow |
| REG-009 | Student records page | Must | In Progress |  |  | Page exists, improve live search/filter |
| REG-010 | Payment logging form | Must | In Progress |  |  | API exists, full UI form flow pending |
| REG-011 | Payment list and filters | Must | In Progress |  |  | Page exists |
| REG-012 | Registrar reports page | Must | In Progress |  |  | UI exists, report generation pending |

### A4. Admin Portal

| ID | Feature | Priority | Status | Owner | Target Date | Notes |
|---|---|---|---|---|---|---|
| ADM-001 | Admin dashboard with system KPIs | Must | In Progress |  |  | Replace mock stats with full live metrics |
| ADM-002 | User management list/search/filter | Must | Done |  |  | API and UI available |
| ADM-003 | Create user accounts | Must | Done |  |  | Admin API available |
| ADM-004 | Update user profile and role | Must | In Progress |  |  | Confirm complete edit workflow |
| ADM-005 | Deactivate/reactivate users | Must | In Progress |  |  | Ensure UI + API parity |
| ADM-006 | School year management | Must | In Progress |  |  | API exists, full admin UX pending |
| ADM-007 | Enrollment period control | Must | Not Started |  |  | Enforce open/close on submissions |
| ADM-008 | Fee structure management CRUD | Must | In Progress |  |  | Page exists, complete create/edit/delete |
| ADM-009 | Settings management | Should | In Progress |  |  | Settings page currently stub-level |
| ADM-010 | Audit log viewer | Should | Not Started |  |  | Model exists, UI/API pending |
| ADM-011 | Admin reports with exports | Must | In Progress |  |  | Build PDF/Excel generation |

### A5. Core Academic and Data Management

| ID | Feature | Priority | Status | Owner | Target Date | Notes |
|---|---|---|---|---|---|---|
| CORE-001 | Student master record schema | Must | Done |  |  | Rich model available |
| CORE-002 | Student search by name/LRN/student ID | Must | In Progress |  |  | API supports, UI tuning needed |
| CORE-003 | Student status lifecycle | Should | Not Started |  |  | Active/inactive/graduated/transferred workflow |
| CORE-004 | Enrollment number generation | Must | Done |  |  | Generated during create |
| CORE-005 | Status history tracking | Must | In Progress |  |  | Ensure surfaced in UI |
| CORE-006 | Duplicate LRN prevention | Must | Not Started |  |  | Validation rule required |
| CORE-007 | Enrollment type-specific rules | Must | In Progress |  |  | Transferee and returning rules pending |

### A6. Document and File Management

| ID | Feature | Priority | Status | Owner | Target Date | Notes |
|---|---|---|---|---|---|---|
| DOC-001 | File upload endpoint | Must | Done |  |  | Accepts PDF/JPG/PNG with size checks |
| DOC-002 | Required docs by enrollment type | Must | Not Started |  |  | Rule engine needed |
| DOC-003 | Upload progress and retry UI | Should | Not Started |  |  | Better parent experience |
| DOC-004 | Document type tagging | Must | In Progress |  |  | Model supports types |
| DOC-005 | Document verification status | Must | Not Started |  |  | Pending/verified/rejected per file |
| DOC-006 | Safe access control for documents | Must | Not Started |  |  | Prevent unauthorized file access |
| DOC-007 | Cloud storage integration | Should | Not Started |  |  | Optional if moving off local uploads |

### A7. Fees, Billing, and Payments

| ID | Feature | Priority | Status | Owner | Target Date | Notes |
|---|---|---|---|---|---|---|
| PAY-001 | Fee structure schema | Must | Done |  |  | Model exists |
| PAY-002 | Fee structure CRUD | Must | In Progress |  |  | Complete all UI actions |
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
| RPT-001 | Enrollment summary report | Must | Not Started |  |  | By status, grade, and date range |
| RPT-002 | DepEd SF1 generation | Must | Not Started |  |  | Registrar requirement |
| RPT-003 | DepEd SF2 generation | Should | Not Started |  |  | If attendance data is available |
| RPT-004 | Payment collection report | Must | Not Started |  |  | By date range and payment method |
| RPT-005 | Export to Excel | Must | Not Started |  |  | Remove ExportDemo placeholder |
| RPT-006 | Export to PDF | Must | Not Started |  |  | Printable official reports |
| RPT-007 | Report filters (date, grade, status) | Must | Not Started |  |  | Essential for operations |

### A9. Notifications and Communication

| ID | Feature | Priority | Status | Owner | Target Date | Notes |
|---|---|---|---|---|---|---|
| NOTIF-001 | In-app notification center | Should | Not Started |  |  | Notification model exists |
| NOTIF-002 | Enrollment submitted confirmation | Must | Not Started |  |  | Parent confirmation |
| NOTIF-003 | Enrollment status change notice | Must | Not Started |  |  | Approve/reject/under review updates |
| NOTIF-004 | Re-upload request notice | Must | Not Started |  |  | Document correction workflow |
| NOTIF-005 | Payment posted confirmation | Should | Not Started |  |  | Parent transparency |
| NOTIF-006 | Email provider integration | Must | Not Started |  |  | SMTP or equivalent integration |

### A10. Audit, Security, and Platform Reliability

| ID | Feature | Priority | Status | Owner | Target Date | Notes |
|---|---|---|---|---|---|---|
| SEC-001 | Audit log write on key actions | Must | Not Started |  |  | Model exists, middleware missing |
| SEC-002 | Audit log admin viewer | Should | Not Started |  |  | For traceability and investigations |
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
