# CTK EnrollSys — User Manual

Version: 1.0.0
Last updated: 2026-05-23

Purpose: Detailed user instructions and step-by-step workflows for Admins, Registrars, and Parents. Includes UI walk-throughs, form-field explanations, common issues, and screenshots placeholders (see [Figures]).

[Figures]

## Table of Contents
- Getting Started
- Access & Roles
- Parent Guide (Complete Enrollment Flow)
- Registrar Guide (Processing & Student Records)
- Admin Guide (System Configuration & Reports)
- Common Workflows
- Payments & Receipts
- Troubleshooting & FAQs
- Accessibility & Best Practices
- Appendix: Contact & Support

## Getting Started
1. Open the application URL provided by your school or developer (e.g., https://enroll.ctkschool.edu or http://localhost:3000 for local dev).
2. Recommended browsers: Chrome, Edge, Firefox (latest versions).
3. Create an account (Parents) or use credentials provided by your Admin.

[Figures]

### Login and Security
- Use the Login page to authenticate. If you forget your password, click "Forgot password" and follow the email-based reset flow.
- Two-factor authentication: if enabled by the Administrator, follow on-screen instructions.

[Figures]

## Access & Roles
- Admin: Manage users, configure school settings, run reports, and access audit logs.
- Registrar: Review enrollments, validate documents, approve/reject applications, create student records, record payments.
- Parent: Submit applications, upload documents, monitor application status.

Permissions summary: view-only vs action privileges are enforced by the system; contact your Admin to change a user's role.

[Figures]

## Parent Guide (Complete Enrollment Flow)
This section walks through every step a parent takes when enrolling a child.

### 1. Create Account / Login
- Click "Register" and fill basic info: parent name, email, password. Email confirmation may be required. [Figures]

### 2. Start Enrollment
- From the dashboard, click "New Enrollment".
- Fill personal details for the student: full name, birthdate, gender, address, previous school (if any).
- Required fields are marked with *.
- Helpful tips shown inline for fields (e.g., use YYYY-MM-DD for dates). [Figures]

### 3. Upload Documents
- Required: PSA/NSO Birth Certificate (PSA), latest Report Card, Parent/Guardian ID, 1x1 photo.
- Accepted formats: PDF, JPG, PNG. Max file size: 10 MB. Filenames should be unique.
- Steps: Choose file → Click Upload → Wait for upload confirmation.
- If upload fails: try again or contact Registrar with the error message.

[Figures]

### 4. Review & Submit
- Review all fields and uploaded documents before submission.
- Click "Submit" to send the application to the Registrar.
- After submission, you will receive an email confirmation and the application appears under "My Applications".

[Figures]

### 5. Tracking & Notifications
- View status labels: Draft, Submitted, Under Review, Approved, Rejected.
- If Registrar requests corrections, you will see notes and can re-upload documents or edit fields.

[Figures]

## Registrar Guide (Processing Enrollments & Student Records)
This guide assumes the user has a Registrar role.

### 1. Accessing the Enrollment Queue
- Navigate to Dashboard → Enrollments.
- Use filters: school year, grade level, status (pending, under review).
- Use keyword search to find applicants by parent name, student name, or application id. [Figures]

### 2. Reviewing an Application
- Click an application to open details: student info, guardian info, uploaded documents.
- Download or view documents in modal. Validate document authenticity and completeness. [Figures]

### 3. Document Verification
- Mark each document as Valid or Invalid. Provide notes for invalid documents to trigger parent notifications. [Figures]

### 4. Approve / Decline / Request Changes
- Approve: assign grade/section and register a student record in the system.
- Decline: provide reasons for decline; the parent is notified.
- Request Changes: add notes and set the application back to Draft for parent action. [Figures]

### 5. Creating Student Records
- On approval, the system prompts for additional student data (school-assigned ID, section). Confirm and save. [Figures]

### 6. Payments
- For assessed fees: open Payments tab, create a new payment entry including method (Cash, Check, Bank Transfer), amount, reference.
- Upload proof of payment if the parent provided a receipt image. [Figures]

## Admin Guide (Configuration, Users, Reports)

### 1. User Management
- Admin → Users → Create User: provide full name, email, role, and initial password.
- Deactivate/reactivate accounts as needed. [Figures]

### 2. System Configuration
- Settings → Academic Year: add or close school years.
- Grade & Sections: manage grade levels and section names.
- Fee Structures: define fees per grade and add fee items (tuition, miscellaneous). [Figures]

### 3. Reports & Exports
- Reports → Select report type (SF1 / SF2 / Enrollment Summary) → choose filters → Generate.
- Exports: PDF and Excel (.xlsx) available. Use Export to download and archive. [Figures]

### 4. Audit Logs
- View system actions in Audit Logs for transparency and compliance. Logs include actor, action, target, and timestamp. [Figures]

## Common Workflows (Step-by-step)
### Enroll a Student (Parent)
1. Register / Login → New Enrollment → Fill form → Upload docs → Submit.
2. Registrar validates → Approve → Student record created.

### Generate a Report (Admin)
1. Reports → Choose report → Set filters → Generate → Export (PDF/Excel).

[Figures]

## Payments & Receipts
- Payments recorded by Registrar are visible to Admins and the paying Parent (if linked to an application).
- Receipts: after recording a payment, download or email receipt to parent. [Figures]

## Troubleshooting & FAQs
Q: I didn't receive the confirmation email.
A: Check spam/junk folder; verify email is correct; contact Admin to resend.

Q: My upload failed due to file size.
A: Reduce file size (compress image or convert to PDF) and retry.

Q: I approved an application by mistake.
A: Contact Admin immediately; Admin can reverse/disable a student record following the data policy.

[Figures]

## Accessibility & Best Practices
- Keyboard navigation supported for core flows.
- Use recommended browsers and keep them updated.
- Keep personal and student data accurate; incorrect data may delay processing.

## Appendix: Contact & Support
- Maintainer / Primary Support: Maverick Lance Coronel — maverick@example.com
- For urgent operational issues (deployment, database): use the on-call support list provided by the Admin team.

---

Add screenshots in place of every [Figures] placeholder to improve clarity. If desired, request an exported PDF or a role-specific quick-start cheat-sheet.