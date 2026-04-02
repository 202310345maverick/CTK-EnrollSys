# Online Enrollment User Flow

## CTK EnrollSys - Enrollment Module Specification

This document describes the complete user flow for the online enrollment module, including all user interactions, system responses, and state transitions.

---

## Table of Contents

1. [Flow Overview](#flow-overview)
2. [Parent Flow - New Enrollment](#parent-flow---new-enrollment)
3. [Parent Flow - Returning Student](#parent-flow---returning-student)
4. [Registrar Flow - Processing](#registrar-flow---processing)
5. [State Diagram](#state-diagram)
6. [Wireframe Descriptions](#wireframe-descriptions)
7. [Email Notifications](#email-notifications)
8. [Error Handling](#error-handling)

---

## Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ENROLLMENT PROCESS OVERVIEW                            │
└─────────────────────────────────────────────────────────────────────────────────┘

PARENT                              SYSTEM                              REGISTRAR
  │                                    │                                    │
  │ 1. Login/Register                  │                                    │
  ├───────────────────────────────────►│                                    │
  │                                    │                                    │
  │ 2. Select "Enroll Student"         │                                    │
  ├───────────────────────────────────►│                                    │
  │                                    │                                    │
  │ 3. Fill Student Information        │                                    │
  ├───────────────────────────────────►│                                    │
  │                                    │                                    │
  │ 4. Upload Required Documents       │                                    │
  ├───────────────────────────────────►│                                    │
  │                                    │                                    │
  │ 5. Review & Submit                 │                                    │
  ├───────────────────────────────────►│                                    │
  │                                    │                                    │
  │                                    │ 6. Create Enrollment Record        │
  │                                    │    Status: PENDING                 │
  │                                    │                                    │
  │                                    │ 7. Send Confirmation Email         │
  │◄───────────────────────────────────┤                                    │
  │                                    │                                    │
  │                                    │ 8. Notify Registrar                │
  │                                    ├───────────────────────────────────►│
  │                                    │                                    │
  │                                    │                    9. Review Application
  │                                    │◄───────────────────────────────────┤
  │                                    │                                    │
  │                                    │ 10. Update Status                  │
  │                                    │     (UNDER_REVIEW)                 │
  │                                    │                                    │
  │ 11. Status Update Email            │                                    │
  │◄───────────────────────────────────┤                                    │
  │                                    │                                    │
  │                                    │               12. Verify Documents │
  │                                    │◄───────────────────────────────────┤
  │                                    │                                    │
  │                                    │               13. Assess Fees      │
  │                                    │◄───────────────────────────────────┤
  │                                    │                                    │
  │                                    │               14. Approve/Reject   │
  │                                    │◄───────────────────────────────────┤
  │                                    │                                    │
  │                                    │ 15. Update Status (APPROVED)       │
  │                                    │                                    │
  │ 16. Approval Email + Fee Details   │                                    │
  │◄───────────────────────────────────┤                                    │
  │                                    │                                    │
  │ 17. View Payment Instructions      │                                    │
  ├───────────────────────────────────►│                                    │
  │                                    │                                    │
  └────────────────────────────────────┴────────────────────────────────────┘
```

---

## Parent Flow - New Enrollment

### Step 1: Authentication

**Page:** `/login` or `/register`

| Action | System Response |
|--------|-----------------|
| Parent visits site | Display login page with "Create Account" option |
| Click "Create Account" | Navigate to registration form |
| Fill registration form | Validate email, password strength |
| Submit registration | Create user account, send verification email |
| Click verification link | Mark email as verified, redirect to login |
| Login with credentials | Create session, redirect to parent dashboard |

### Step 2: Initiate Enrollment

**Page:** `/parent/dashboard`

| Action | System Response |
|--------|-----------------|
| Click "Enroll a Student" | Check if enrollment period is open |
| | If closed: Show message with enrollment dates |
| | If open: Navigate to enrollment wizard |

### Step 3: Student Information Form (Multi-Step Wizard)

**Page:** `/parent/enrollment/new`

#### Step 3.1: Basic Information
```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1 OF 5: STUDENT INFORMATION                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Enrollment Type: ○ New Student  ○ Returning  ○ Transferee     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ First Name *          │ Middle Name        │ Last Name * │    │
│  │ [________________]    │ [____________]     │ [__________]│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Suffix (Jr., Sr., etc.): [______]                              │
│                                                                  │
│  ┌──────────────────────┐ ┌────────────────────────────────┐   │
│  │ Date of Birth *      │ │ Place of Birth *               │   │
│  │ [MM/DD/YYYY  📅]     │ │ [________________________]     │   │
│  └──────────────────────┘ └────────────────────────────────┘   │
│                                                                  │
│  Gender *: ○ Male  ○ Female                                     │
│                                                                  │
│  Nationality *: [Filipino            ▼]                         │
│                                                                  │
│  Religion: [______________________]                              │
│                                                                  │
│  LRN (if available): [____________] (12 digits)                 │
│                                                                  │
│                                      [Cancel]  [Next Step →]     │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 3.2: Grade Level Selection
```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2 OF 5: GRADE LEVEL                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Select Grade Level for SY 2024-2025: *                         │
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │  Kinder 1   │ │  Kinder 2   │ │   Grade 1   │                │
│  └─────────────┘ └─────────────┘ └─────────────┘                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │   Grade 2   │ │   Grade 3   │ │   Grade 4   │                │
│  └─────────────┘ └─────────────┘ └─────────────┘                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │   Grade 5   │ │   Grade 6   │ │   Grade 7   │                │
│  └─────────────┘ └─────────────┘ └─────────────┘                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │   Grade 8   │ │   Grade 9   │ │  Grade 10   │                │
│  └─────────────┘ └─────────────┘ └─────────────┘                │
│                                                                  │
│  (For Transferees Only)                                         │
│  Previous School: [________________________________]            │
│  Last Grade Completed: [______________]                         │
│  School Year: [________]                                         │
│                                                                  │
│                            [← Previous]  [Next Step →]           │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 3.3: Contact & Address Information
```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3 OF 5: CONTACT INFORMATION                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Current Address                                                 │
│  ───────────────                                                │
│  Street Address *: [________________________________]           │
│  Barangay *: [____________________]                             │
│  City/Municipality *: [Olongapo City    ▼]                      │
│  Province *: [Zambales             ▼]                           │
│  ZIP Code *: [2200  ]                                           │
│                                                                  │
│  Emergency Contact                                               │
│  ─────────────────                                              │
│  Name *: [____________________________]                         │
│  Relationship *: [________________]                              │
│  Contact Number *: [+63 9__ ___ ____]                           │
│                                                                  │
│                            [← Previous]  [Next Step →]           │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 3.4: Parent/Guardian Information
```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4 OF 5: PARENT/GUARDIAN INFORMATION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Father's Information                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Full Name           │ Occupation         │ Contact No.  │    │
│  │ [________________]  │ [______________]   │ [__________] │    │
│  │ Email: [________________________]                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Mother's Information                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Full Name           │ Occupation         │ Contact No.  │    │
│  │ [________________]  │ [______________]   │ [__________] │    │
│  │ Email: [________________________]                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ☐ Different Guardian (not parents)                             │
│                                                                  │
│                            [← Previous]  [Next Step →]           │
└─────────────────────────────────────────────────────────────────┘
```

### Step 4: Document Upload

**Page:** `/parent/enrollment/new` (Step 5)

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5 OF 5: DOCUMENT UPLOAD                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Please upload the following documents (PDF, JPG, PNG - Max 5MB)│
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📄 PSA Birth Certificate *                     [Required] │ │
│  │                                                            │ │
│  │    ┌─────────────────────────────────────────────────┐    │ │
│  │    │                                                 │    │ │
│  │    │     📁 Drag & drop file here or click to       │    │ │
│  │    │           browse                                │    │ │
│  │    │                                                 │    │ │
│  │    └─────────────────────────────────────────────────┘    │ │
│  │                                                            │ │
│  │    ✅ psa_birth_certificate.pdf (1.2 MB)     [Remove]     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📄 Report Card (Previous Grade) *              [Required] │ │
│  │    [ Not yet uploaded ]                        [Upload]   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📷 2x2 ID Photo (White Background) *           [Required] │ │
│  │    [ Not yet uploaded ]                        [Upload]   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  (For Transferees Only)                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📄 Certificate of Good Moral Character                    │ │
│  │    [ Not yet uploaded ]                        [Upload]   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│                            [← Previous]  [Review Application →]  │
└─────────────────────────────────────────────────────────────────┘
```

### Step 5: Review & Submit

**Page:** `/parent/enrollment/review`

```
┌─────────────────────────────────────────────────────────────────┐
│  REVIEW YOUR APPLICATION                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ STUDENT INFORMATION                           [Edit ✏️]  │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ Name: Maria Santos Dela Cruz                             │    │
│  │ Birth Date: May 15, 2015 (Age: 9)                       │    │
│  │ Gender: Female                                           │    │
│  │ LRN: 123456789012                                        │    │
│  │ Applying for: Grade 3 (SY 2024-2025)                    │    │
│  │ Enrollment Type: Returning Student                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ PARENT/GUARDIAN                               [Edit ✏️]  │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ Father: Juan Dela Cruz - Engineer - 0917-123-4567       │    │
│  │ Mother: Maria Clara Dela Cruz - Teacher - 0917-987-6543│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ UPLOADED DOCUMENTS                            [Edit ✏️]  │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ ✅ PSA Birth Certificate       psa_cert.pdf             │    │
│  │ ✅ Report Card                 report_card.pdf          │    │
│  │ ✅ 2x2 ID Photo               id_photo.jpg             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ☑️ I certify that all information provided is true and correct.│
│                                                                  │
│  ⚠️ Once submitted, you cannot edit this application.           │
│     The school will contact you for any clarifications.         │
│                                                                  │
│                    [← Back to Edit]  [Submit Application ✓]      │
└─────────────────────────────────────────────────────────────────┘
```

### Step 6: Confirmation

**Page:** `/parent/enrollment/success`

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                          ✅                                      │
│                                                                  │
│            APPLICATION SUBMITTED SUCCESSFULLY!                   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │  Enrollment Number: ENR-2024-00125                       │    │
│  │  Student: Maria Santos Dela Cruz                         │    │
│  │  Grade Level: Grade 3                                    │    │
│  │  Status: PENDING                                         │    │
│  │                                                          │    │
│  │  Date Submitted: March 15, 2024 10:30 AM                │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  What's Next?                                                    │
│  ────────────                                                   │
│  1. Our registrar will review your application within 3-5       │
│     working days.                                                │
│                                                                  │
│  2. You will receive an email notification when your            │
│     application status is updated.                               │
│                                                                  │
│  3. Check your dashboard regularly for updates.                  │
│                                                                  │
│  📧 A confirmation email has been sent to:                       │
│     juan.delacruz@email.com                                      │
│                                                                  │
│           [View Application]  [Go to Dashboard]                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Parent Flow - Returning Student

For returning students, the system pre-fills data from the previous enrollment:

1. Parent selects "Enroll Existing Student" from dashboard
2. System shows list of previously enrolled children
3. Parent selects student to re-enroll
4. Form pre-populates with existing data
5. Parent updates only changed information
6. Document requirements may be reduced (only new report card)
7. Same review and submit flow

---

## Registrar Flow - Processing

### Enrollment Queue

**Page:** `/registrar/enrollments`

```
┌─────────────────────────────────────────────────────────────────┐
│  ENROLLMENT APPLICATIONS                          SY 2024-2025  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filter: [All Statuses ▼] [All Grades ▼]  🔍 [Search...]        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Status    │ Enrollment #   │ Student        │ Grade │ Date │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ 🟡 Pending│ ENR-2024-00125│ Dela Cruz, M.  │ Gr. 3 │ 3/15 │ │
│  │ 🟡 Pending│ ENR-2024-00124│ Santos, J.     │ Gr. 7 │ 3/15 │ │
│  │ 🔵 Review │ ENR-2024-00123│ Reyes, A.      │ K-2   │ 3/14 │ │
│  │ 🟢 Approved│ ENR-2024-00122│ Garcia, P.    │ Gr. 5 │ 3/14 │ │
│  │ 🔴 Rejected│ ENR-2024-00121│ Cruz, M.      │ Gr. 1 │ 3/13 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  📊 Summary: 45 Pending | 12 Under Review | 156 Approved        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Application Review

**Page:** `/registrar/enrollments/[id]`

```
┌─────────────────────────────────────────────────────────────────┐
│  ENROLLMENT APPLICATION - ENR-2024-00125                        │
│  Status: 🟡 PENDING                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Student Info] [Documents] [Fee Assessment] [History]          │
│  ═══════════════                                                │
│                                                                  │
│  Personal Information                                            │
│  ────────────────────                                           │
│  Full Name: Maria Santos Dela Cruz                              │
│  Birth Date: May 15, 2015                                       │
│  Age: 9 years old                                                │
│  Gender: Female                                                  │
│  LRN: 123456789012                                              │
│  Applying for: Grade 3                                           │
│  Type: Returning Student                                         │
│                                                                  │
│  Parent/Guardian Information                                     │
│  ──────────────────────────                                     │
│  Father: Juan Dela Cruz (0917-123-4567)                         │
│  Mother: Maria Clara Dela Cruz (0917-987-6543)                  │
│  Email: juan.delacruz@email.com                                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Actions                                                     │ │
│  │                                                             │ │
│  │ [Start Review] [Request Additional Documents]              │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Document Verification Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  [Student Info] [Documents] [Fee Assessment] [History]          │
│                  ═══════════                                    │
│                                                                  │
│  Document Checklist                                              │
│  ──────────────────                                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📄 PSA Birth Certificate                                   │ │
│  │    Status: ⏳ Pending Verification                          │ │
│  │    Uploaded: March 15, 2024                                │ │
│  │    [View Document 🔍]                                       │ │
│  │                                                             │ │
│  │    ○ Verify ✓   ○ Reject ✗                                 │ │
│  │    Remarks: [_______________________________]              │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📄 Report Card                                              │ │
│  │    Status: ✅ Verified                                      │ │
│  │    Verified by: Registrar Santos on March 16, 2024         │ │
│  │    [View Document 🔍]                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📷 2x2 ID Photo                                             │ │
│  │    Status: ❌ Rejected                                       │ │
│  │    Reason: Photo background is not white                    │ │
│  │    [View Document 🔍]                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│             [Save Document Status] [Request Re-upload]          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Fee Assessment Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  [Student Info] [Documents] [Fee Assessment] [History]          │
│                             ════════════════                    │
│                                                                  │
│  Fee Structure for Grade 3 (SY 2024-2025)                       │
│  ────────────────────────────────────────                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Fee Item                              │ Amount              │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Tuition Fee                           │ ₱18,000.00          │ │
│  │ Miscellaneous Fee                     │ ₱5,000.00           │ │
│  │ Books and Learning Materials          │ ₱2,000.00           │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ TOTAL                                 │ ₱25,000.00          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Apply Discount (Optional)                                       │
│  ─────────────────────────                                      │
│  ☐ Sibling Discount (10%)                                       │
│  ☐ Early Bird Discount (5%) - Deadline: April 30, 2024         │
│  ☐ Academic Scholar (varies)                                    │
│                                                                  │
│  Payment Plan                                                    │
│  ────────────                                                   │
│  ○ Annual (5% discount)      ₱23,750.00                         │
│  ○ Semi-Annual (3% discount) ₱24,250.00                         │
│  ● Quarterly (no discount)   ₱25,000.00                         │
│                                                                  │
│                                     [Save Fee Assessment]       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Final Decision

```
┌─────────────────────────────────────────────────────────────────┐
│  ENROLLMENT DECISION                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Student: Maria Santos Dela Cruz                                 │
│  Grade: Grade 3                                                  │
│  Documents: ✅ All Verified                                      │
│  Fee Assessed: ₱25,000.00                                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  Decision: ○ Approve Enrollment                            │ │
│  │            ○ Reject Enrollment                              │ │
│  │            ○ Waitlist                                       │ │
│  │                                                             │ │
│  │  Remarks (will be sent to parent):                         │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │ Enrollment approved. Please proceed to payment.     │   │ │
│  │  │ Welcome to Christ the King Catholic School!         │   │ │
│  │  │                                                     │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  │                                                             │ │
│  │                    [Cancel]  [Confirm Decision]             │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## State Diagram

```
                                    ┌─────────────┐
                                    │   START     │
                                    └──────┬──────┘
                                           │
                                           ▼
                              ┌────────────────────────┐
                              │       PENDING          │
                              │ (Application Received) │
                              └───────────┬────────────┘
                                          │
                           Registrar clicks "Start Review"
                                          │
                                          ▼
                              ┌────────────────────────┐
                              │     UNDER_REVIEW       │
                              │ (Being Processed)      │
                              └───────────┬────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
          Documents rejected      All verified         Capacity full
                    │                     │                     │
                    ▼                     ▼                     ▼
          ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
          │   REJECTED   │      │   APPROVED   │      │  WAITLISTED  │
          └──────────────┘      └───────┬──────┘      └───────┬──────┘
                    │                   │                     │
                    │                   │            Slot becomes available
                    │                   │                     │
                    │                   │                     ▼
                    │                   │           ┌──────────────┐
                    │                   │           │   APPROVED   │
                    │                   │           └───────┬──────┘
                    │                   │                   │
                    │           Payment confirmed           │
                    │                   │                   │
                    │                   ▼                   │
                    │          ┌──────────────┐             │
                    │          │   ENROLLED   │◄────────────┘
                    │          │  (Complete)  │
                    │          └──────────────┘
                    │
           Parent re-applies
                    │
                    ▼
          ┌──────────────┐
          │   PENDING    │
          │ (New App)    │
          └──────────────┘
```

---

## Email Notifications

### 1. Application Submitted (to Parent)

```
Subject: Enrollment Application Received - ENR-2024-00125

Dear Mr./Mrs. Dela Cruz,

Thank you for submitting your enrollment application for:

Student: Maria Santos Dela Cruz
Grade Level: Grade 3
School Year: 2024-2025
Application Number: ENR-2024-00125

Your application has been received and is now pending review by our registrar's office. You will be notified via email when there are updates to your application status.

Estimated processing time: 3-5 working days

You can track your application status at:
https://enrollsys.ctkschool.edu.ph/parent/enrollments/ENR-2024-00125

Thank you for choosing Christ the King Catholic School.

Best regards,
CTK EnrollSys
```

### 2. Under Review (to Parent)

```
Subject: Application Under Review - ENR-2024-00125

Your enrollment application for Maria Santos Dela Cruz is now being reviewed...
```

### 3. Documents Need Re-upload (to Parent)

```
Subject: Action Required: Document Re-upload Needed - ENR-2024-00125

Dear Mr./Mrs. Dela Cruz,

We have reviewed the documents for your enrollment application and found the following issue(s):

❌ 2x2 ID Photo
   Reason: Photo background is not white. Please upload a new photo with a white background.

Please log in to your account and upload the required documents within 7 days.

[Upload Documents Now]
```

### 4. Application Approved (to Parent)

```
Subject: 🎉 Enrollment Approved - Maria Santos Dela Cruz

Dear Mr./Mrs. Dela Cruz,

Congratulations! We are pleased to inform you that the enrollment application for Maria Santos Dela Cruz has been APPROVED.

Enrollment Details:
- Student: Maria Santos Dela Cruz
- Grade Level: Grade 3
- School Year: 2024-2025
- Total Fees: ₱25,000.00

NEXT STEPS:
1. Log in to your parent portal
2. View the fee assessment breakdown
3. Proceed to the school cashier for payment
4. Payment deadline: June 30, 2024

[View Enrollment Details]

Welcome to the Christ the King Catholic School family!
```

### 5. New Application Alert (to Registrar)

```
Subject: New Enrollment Application - ENR-2024-00125

A new enrollment application has been submitted:

Student: Maria Santos Dela Cruz
Grade Level: Grade 3
Type: Returning Student
Submitted by: Juan Dela Cruz (parent)
Date: March 15, 2024 10:30 AM

[Review Application]
```

---

## Error Handling

| Error Scenario | User Message | System Action |
|---------------|--------------|---------------|
| Enrollment period closed | "Enrollment is currently closed. The next enrollment period is [date]." | Block access to enrollment form |
| File too large | "File size exceeds 5MB limit. Please upload a smaller file." | Reject upload, retain form data |
| Invalid file type | "Please upload a PDF, JPG, or PNG file." | Reject upload, show accepted formats |
| Required field missing | "[Field name] is required." | Highlight field, prevent submission |
| Invalid LRN format | "LRN must be exactly 12 digits." | Show validation error |
| Duplicate enrollment | "An enrollment for this student already exists for SY 2024-2025." | Show link to existing enrollment |
| Session timeout | "Your session has expired. Please log in again." | Save draft, redirect to login |
| Upload failed | "Upload failed. Please try again." | Retry mechanism, preserve file selection |

---

*Last Updated: March 2024*
*Version: 1.0*
