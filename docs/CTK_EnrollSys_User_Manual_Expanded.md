# CTK EnrollSys — User Manual (Expanded)

Version: 1.1.0
Last updated: 2026-05-23

Revision History
- 1.0.0 — Initial user manual (baseline)
- 1.1.0 — Expanded user manual: detailed workflows, examples, and troubleshooting (this file)

Purpose
This document is a comprehensive user manual for CTK EnrollSys. It targets Parents, Registrars, and Admin users. It includes step-by-step workflows, field-level explanations, troubleshooting steps, examples, and placeholders [Figures] where screenshots should be inserted.

Audience
- Parents (applicants/guardians)
- Registrar staff
- School administrators

[Figures]

---

## Table of Contents
1. Getting Started
2. Account & Security
3. Parent Guide — Complete Enrollment Flow
   - Create Account
   - Start Enrollment
   - Upload Documents
   - Review & Submit
   - Tracking & Notifications
4. Registrar Guide — Processing Enrollments
   - Enrollment Queue
   - Review & Verification
   - Approve / Decline / Request Changes
   - Creating Student Records
   - Payments
5. Admin Guide — Configuration & Reports
   - User Management
   - System Settings
   - Fee Structures
   - Reports & Exports
6. Common Workflows (Step-by-step)
7. Payments & Receipts
8. Notifications & Email Templates
9. Troubleshooting & FAQs
10. Accessibility & Best Practices
11. Appendix: Glossary, Support & Technical Notes

[Figures]

---

## 1. Getting Started

System URLs
- Production: (example) https://enroll.ctkschool.edu
- Development: http://localhost:3000

Supported browsers
- Google Chrome (latest)
- Microsoft Edge (latest)
- Mozilla Firefox (latest)

Minimum client requirements
- Modern desktop or mobile browser with JavaScript enabled
- Recommended screen resolution: 1024x768 or higher

Accessing the system
1. Open the provided URL in a supported browser.
2. If you are a Parent: register using your email and a secure password.
3. If you are an Admin/Registrar: use credentials provided by the school IT team.

[Figures]

---

## 2. Account & Security

Creating a Parent account
1. Click "Register" on the login page.
2. Complete fields: Full Name, Email, Password (min 8 chars, include letters and numbers).
3. Confirm email if the system requires email verification.

Sample values
- Full Name: Maria Santos
- Email: maria.santos@example.com
- Password: StrongPass123

Login
- Use the email and password entered during registration.
- Use "Forgot password" if necessary; an email with a reset link will be sent.

Two-Factor Authentication (2FA)
- If enabled by Admin, 2FA steps will be presented after login.
- Use an authenticator app or SMS (depending on configuration).

Security best practices
- Use a unique, strong password.
- Never share login credentials.
- Log out after using a shared computer.

[Figures]

---

## 3. Parent Guide — Complete Enrollment Flow

Overview
This section walks a Parent through the full enrollment lifecycle from account creation to post-approval tasks.

### 3.1 Create Account / Login
1. Open the site and click "Register".
2. Fill the registration form, then confirm via email.
3. Log in to view the Parent Dashboard.

[Figures]

### 3.2 Start a New Enrollment (Step-by-step)
1. From Dashboard, click "New Enrollment".
2. Step 1 — Student Information
   - Student Full Name: (required)
   - Preferred First Name: (optional)
   - Date of Birth: (use YYYY-MM-DD)
   - Gender: (select)
   - Previous School: (if any)
   - Intended Grade Level: (select current year target grade)
   - Emergency Contact: name and phone number
3. Step 2 — Guardian Information
   - Name, Relationship to Student, Contact Number, Email
4. Step 3 — Additional Details
   - Medical Notes / Special Needs (if any)
   - Siblings currently enrolled (if any)

Field validation rules (examples)
- Date fields must use YYYY-MM-DD.
- Names accept letters, spaces, hyphens.
- Phone numbers: digits only, 7–15 digits.

[Figures]

### 3.3 Upload Documents
Required documents (typical)
- PSA / NSO Birth Certificate (PSA)
- Latest Report Card (if transferring)
- Parent/Guardian ID
- 1x1 ID photo or passport photo

Accepted formats and limits
- PDF, JPG, PNG
- Maximum file size: 10 MB per file
- Recommended filename format: lastname_firstname_documenttype_date.pdf

Upload steps
1. Click "Choose file" next to the required document label.
2. Select file from your device.
3. Click "Upload" and wait for confirmation (green check or message).
4. Repeat for all required documents.

Common upload errors & fixes
- Error: "File too large" — compress the image or convert JPG to PDF.
- Error: "Invalid file type" — ensure PDF/JPG/PNG format.
- Error: "Upload failed" — check internet connection and retry.

[Figures]

### 3.4 Review & Submit
1. After completing all steps, click "Review".
2. Verify each field and uploaded document.
3. Click "Submit".
4. A confirmation message and email will be sent.

What happens after submission
- Status changes from Draft → Submitted.
- Registrar is notified to review the application.

[Figures]

### 3.5 Tracking & Notifications
- Dashboard → My Applications shows all submissions and statuses.
- Status values: Draft, Submitted, Under Review, Approved, Rejected.
- If corrections are requested, a note is added to the application and status returns to Draft.

Example notification text
- "Your enrollment application for Juan Santos (Application ID: 2026-0001) has been received. Status: Submitted."

[Figures]

---

## 4. Registrar Guide — Processing Enrollments

Overview
Registrar users review incoming applications, validate documents, request corrections, approve/reject, and record payments.

### 4.1 Accessing the Enrollment Queue
1. Login and navigate to Dashboard → Enrollments.
2. Use filters: school year, grade level, status, date range.
3. Sort by incoming date or application ID.

[Figures]

### 4.2 Reviewing an Application
1. Click an application row to open details.
2. Review: Student details, Guardian details, Documents.
3. Use "View" to open documents in modal or download.
4. Add notes for the parent if needed.

Document verification checklist
- PSA present and readable
- ID photo acceptable quality
- Report card matches grade expectations
- File names and upload timestamps present

[Figures]

### 4.3 Approve / Decline / Request Changes
- Approve
  1. Click "Approve".
  2. Assign Grade / Section and Student ID.
  3. Save to create student record.
- Decline
  1. Click "Decline" and enter reason. Parent receives notification.
- Request Changes
  1. Click "Request Changes" and add guidance. Application returns to Draft.

[Figures]

### 4.4 Creating Student Records
1. After approval, a dialog prompts for student-specific fields (school ID, enrollment date, section).
2. Complete and save.
3. Student appears in Student Records with link to original application.

[Figures]

### 4.5 Payments
1. Open Payments tab for an application or student.
2. Click "Record Payment".
   - Payment method: Cash, Check, Bank Transfer
   - Amount, Date, Reference number
   - Upload scanned receipt (optional)
3. Save; system logs transaction and issues a receipt.

[Figures]

---

## 5. Admin Guide — Configuration & Reports

### 5.1 User Management
- Path: Admin → Users
- Create user: Full name, email, role (Admin, Registrar, Parent), initial password.
- Reset passwords and deactivate/reactivate accounts.

Best practices
- Create at least two Admin users for redundancy.
- Grant Registrar role only to authorized staff.

[Figures]

### 5.2 System Configuration
- Academic Years: Add new year, close old year, set enrollment windows.
- Grade levels: Add or rename grade levels and sections.
- Fee Structures: Create fee items (Tuition, Miscellaneous, Books), assign to grade levels.

[Figures]

### 5.3 Reports & Exports
- Common reports: Enrollment Summary, SF1, SF2, Student Roster, Payments Report.
- Steps: Reports → Select report → Apply filters → Generate → Export (PDF / Excel)

Export tips
- Large exports may take time; use date-range filters.
- Use CSV/Excel for spreadsheet analysis.

[Figures]

### 5.4 Audit Logs
- View actions taken by users: who performed what action and when.
- Use for compliance and to troubleshoot incorrect data edits.

[Figures]

---

## 6. Common Workflows (Step-by-step)

A. Enroll a Student (Parent)
1. Register/Login → New Enrollment → Fill student details → Upload docs → Submit.
2. Monitor status and respond to change requests.

B. Process Enrollment (Registrar)
1. Dashboard → Enrollments → Open application → Verify docs → Approve & Create student record → Notify parent.

C. Record Payment (Registrar)
1. Student → Payments → Record Payment → Upload receipt → Send receipt to parent.

[Figures]

---

## 7. Payments & Receipts

Recording payments
- Use the Payment form to log the date, amount, method, and reference.
- Attach proof of payment when available.

Generating receipts
- After saving a payment, choose "Download Receipt" or "Email Receipt".
- Receipts include school header, student name, application ID, amount, date, and payment reference.

[Figures]

---

## 8. Notifications & Email Templates

Example: Enrollment Received
Subject: Enrollment Received — [Student Name] (Application ID: [ID])
Body: "We have received your application. Status: Submitted. Registrar will review and respond within 3–5 business days."

Example: Request for Changes
Subject: Action Required — Enrollment Application [ID]
Body: "Your application requires additional documents or corrections. Please log in to your account and follow the notes to update your application."

[Figures]

---

## 9. Troubleshooting & FAQs

Q: I didn't receive the confirmation email.
A: Check spam/junk folder. Verify email is correct. Ask Admin to resend or check SMTP settings.

Q: Upload failed with "File too large".
A: Compress image or convert to PDF. For Windows: use Print > Save as PDF. For Mac: Export as PDF.

Q: I accidentally approved the wrong application.
A: Contact Admin immediately. Admin can reverse student activation and update records.

Q: How long until registration is processed?
A: Typical SLA: 3–5 business days during normal enrollment periods.

[Figures]

---

## 10. Accessibility & Best Practices

Accessibility
- Keyboard navigation supported for main flows.
- Forms provide labels and ARIA attributes where possible.

Best practices for staff
- Keep admin credentials secure.
- Regularly export and back up enrollment data.
- Use test accounts when training staff.

[Figures]

---

## 11. Appendix: Glossary, Support & Technical Notes

Glossary
- Application ID: Unique ID assigned to each enrollment submission.
- PSA: Philippine Statistics Authority birth certificate.
- SF1/SF2: DepEd standardized forms for student records.

Support & Contacts
- Primary maintainer: Maverick Lance Coronel — maverick@example.com
- Admin/IT contact: admin@example-school.org

Technical notes (short)
- To run locally: `npm install` then `npm run dev`.
- Tests: `npm run test` and `npm run test:coverage`.
- Default dev port: 3000.

Files to include as screenshots
- Login page
- Dashboard (Parent and Registrar views)
- New Enrollment form (all steps)
- Document upload modal
- Application details & verification page
- Payment entry form
- Reports generation page
- User management page (Admin)

[Figures]

---

End of expanded user manual. Replace each [Figures] placeholder with the appropriate screenshot images before finalizing and distributing the manual.