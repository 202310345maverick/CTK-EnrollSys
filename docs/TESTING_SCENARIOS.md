# Testing Scenarios

## CTK EnrollSys - Test Cases for Validation

This document outlines key testing scenarios to validate the system against the identified problems from the project profiling report.

---

## Table of Contents

1. [Problem-Focused Test Scenarios](#problem-focused-test-scenarios)
2. [Functional Test Cases](#functional-test-cases)
3. [Security Test Cases](#security-test-cases)
4. [Performance Test Cases](#performance-test-cases)
5. [Usability Test Cases](#usability-test-cases)
6. [Integration Test Cases](#integration-test-cases)
7. [Test Data Requirements](#test-data-requirements)

---

## Problem-Focused Test Scenarios

### Problem 1: Long Queues During Enrollment

**Root Cause:** Paper-based enrollment requires physical presence

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| LQ-01 | Multiple simultaneous enrollments | 10 parents submit enrollment forms at the same time | All 10 enrollments are processed without errors or timeout | High |
| LQ-02 | Complete enrollment without physical visit | Parent completes entire enrollment online from home | Enrollment submitted successfully without requiring school visit | High |
| LQ-03 | Document upload instead of submission | Upload PSA, Report Card, ID Photo digitally | Documents stored securely, viewable by registrar | High |
| LQ-04 | Real-time status tracking | Parent checks enrollment status | Current status displayed with timestamp and remarks | Medium |
| LQ-05 | Peak load handling | 50 concurrent users during enrollment period | System remains responsive (< 3 second response time) | High |

### Problem 2: Risk of Data/Document Loss

**Root Cause:** Physical paper storage vulnerable to damage/misplacement

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| DL-01 | Document backup verification | Upload document, verify Cloudinary storage | Document accessible via stored URL | Critical |
| DL-02 | Database backup exists | Check MongoDB Atlas backup configuration | Automatic daily backups enabled | Critical |
| DL-03 | Recover deleted student record | Soft-delete student, attempt recovery | Record restored with all associated data | High |
| DL-04 | Document version tracking | Re-upload document for same enrollment | Old version retained, new version marked as current | Medium |
| DL-05 | Audit trail preservation | Perform various actions, check audit log | All actions logged with user, timestamp, changes | High |

### Problem 3: Manual Encoding Errors

**Root Cause:** Hand-written forms lead to misinterpretation

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| ME-01 | Form validation - required fields | Submit form with missing required fields | Clear error messages, form not submitted | High |
| ME-02 | LRN format validation | Enter invalid LRN (wrong length, non-numeric) | Validation error displayed | High |
| ME-03 | Contact number validation | Enter invalid phone format | Validation error with correct format hint | Medium |
| ME-04 | Email format validation | Enter malformed email | Validation error displayed | Medium |
| ME-05 | Date validation | Enter future birth date | Validation error displayed | Medium |
| ME-06 | Duplicate LRN prevention | Enter existing LRN for new student | Warning about duplicate, prevent submission | High |
| ME-07 | Pre-filled returning student data | Returning student enrollment | Previous data correctly pre-populated | High |
| ME-08 | Grade level age appropriateness | Select grade level not matching age | Warning displayed (optional proceed) | Low |

### Problem 4: Slow Retrieval of Student Records

**Root Cause:** Manual searching through physical files

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| SR-01 | Search by name | Search "Dela Cruz" in student records | Results displayed in < 1 second | High |
| SR-02 | Search by LRN | Search by exact LRN | Student record displayed immediately | High |
| SR-03 | Search by student ID | Search "2024-00001" | Student record displayed immediately | High |
| SR-04 | Filter by grade level | Filter students by "Grade 3" | List filtered correctly | Medium |
| SR-05 | Filter by enrollment status | Filter by "approved" enrollments | Correct records displayed | Medium |
| SR-06 | Search across multiple fields | Search partial name + grade | Correct intersection of results | Medium |
| SR-07 | Export search results | Export filtered list to Excel | Excel file downloads with correct data | Medium |
| SR-08 | Pagination performance | Navigate through 500+ student records | Smooth pagination, no lag | High |

---

## Functional Test Cases

### Authentication Module

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| AUTH-01 | Successful login | Enter valid credentials | Redirected to dashboard | Critical |
| AUTH-02 | Failed login - wrong password | Enter incorrect password | Error message, no login | Critical |
| AUTH-03 | Failed login - inactive account | Login with deactivated account | "Account deactivated" message | High |
| AUTH-04 | Password reset request | Request password reset | Reset email sent | High |
| AUTH-05 | Password reset completion | Click reset link, set new password | Password updated, can login | High |
| AUTH-06 | Session timeout | Leave session idle for 30 minutes | Automatically logged out | Medium |
| AUTH-07 | Concurrent session | Login from two browsers | Both sessions active (or policy enforced) | Low |
| AUTH-08 | Registration with existing email | Register with used email | "Email already exists" error | High |

### Enrollment Module

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| ENR-01 | Submit new student enrollment | Complete all steps, submit | Enrollment created with "pending" status | Critical |
| ENR-02 | Submit returning student enrollment | Select existing student, update info | Enrollment created with pre-filled data | High |
| ENR-03 | Submit transferee enrollment | Select transferee, add previous school | Previous school info saved | High |
| ENR-04 | Document upload - valid PDF | Upload 2MB PDF | Upload successful, preview available | Critical |
| ENR-05 | Document upload - oversized file | Upload 10MB file | Error message, upload rejected | High |
| ENR-06 | Document upload - invalid format | Upload .exe file | Error message, upload rejected | Critical |
| ENR-07 | Save draft enrollment | Fill partially, navigate away | Data preserved for continuation | Medium |
| ENR-08 | Enrollment status update | Registrar approves enrollment | Status changed, parent notified | High |
| ENR-09 | Enrollment rejection | Registrar rejects with reason | Status changed, rejection reason sent | High |
| ENR-10 | Request document re-upload | Registrar requests new document | Parent notified, can re-upload | High |

### Payment Module

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| PAY-01 | Log cash payment | Record cash payment with details | Payment recorded, receipt number generated | Critical |
| PAY-02 | Log check payment | Record check payment with check number | Payment recorded with check details | High |
| PAY-03 | View payment history | Access student payment history | All payments listed chronologically | High |
| PAY-04 | Calculate remaining balance | After partial payment | Correct remaining balance displayed | High |
| PAY-05 | Void payment | Void erroneous payment | Payment marked void, balance recalculated | High |
| PAY-06 | Generate payment summary | Request payment summary report | PDF/Excel report generated correctly | Medium |

### Report Generation Module

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| RPT-01 | Generate enrollment summary | Request enrollment statistics | Report shows totals by status, grade | High |
| RPT-02 | Generate SF1 (School Register) | Request DepEd SF1 report | Formatted report with required fields | High |
| RPT-03 | Generate payment collection report | Request payment report for period | Accurate totals, transaction list | High |
| RPT-04 | Export to Excel | Export any report to Excel | Valid Excel file with correct data | High |
| RPT-05 | Export to PDF | Export any report to PDF | Formatted PDF document | High |
| RPT-06 | Report date range filter | Generate report for specific dates | Only data within range included | Medium |

### User Management Module (Admin)

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| USR-01 | Create registrar account | Admin creates registrar user | Account created, welcome email sent | High |
| USR-02 | Update user profile | Admin updates user details | Profile updated, audit logged | Medium |
| USR-03 | Deactivate user | Admin deactivates account | User cannot login | High |
| USR-04 | Reactivate user | Admin reactivates account | User can login again | Medium |
| USR-05 | View audit log | Admin views activity log | All actions displayed with details | Medium |

---

## Security Test Cases

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| SEC-01 | Role-based access - Admin pages | Registrar accesses admin URL | Access denied, redirected | Critical |
| SEC-02 | Role-based access - Parent pages | Registrar accesses parent URL | Access denied, redirected | Critical |
| SEC-03 | Parent data isolation | Parent A tries to view Parent B's children | Access denied | Critical |
| SEC-04 | SQL injection prevention | Enter malicious input in search | Input sanitized, no data exposure | Critical |
| SEC-05 | XSS prevention | Enter script tags in form fields | Script not executed, escaped | Critical |
| SEC-06 | CSRF protection | Submit form without valid token | Request rejected | High |
| SEC-07 | Password storage | Check password in database | Passwords hashed (bcrypt) | Critical |
| SEC-08 | Sensitive data in URL | Check URLs for sensitive params | No sensitive data in URLs | High |
| SEC-09 | Document access control | Try to access document without auth | Access denied | Critical |
| SEC-10 | Brute force protection | Attempt 10 failed logins rapidly | Account temporarily locked | High |

---

## Performance Test Cases

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| PERF-01 | Dashboard load time | Load dashboard with 100 enrollments | Page loads in < 2 seconds | High |
| PERF-02 | Student list pagination | Load page with 500 students | Paginated results in < 1 second | High |
| PERF-03 | Document upload speed | Upload 5MB document | Upload completes in < 10 seconds | Medium |
| PERF-04 | Report generation time | Generate report for 500 students | Report generated in < 30 seconds | Medium |
| PERF-05 | Concurrent user capacity | 50 users performing actions | No errors, acceptable response times | High |
| PERF-06 | Search performance | Search in 1000+ student database | Results in < 500ms | High |
| PERF-07 | API response times | Monitor API endpoints | 95th percentile < 500ms | Medium |

---

## Usability Test Cases

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| USE-01 | First-time enrollment | New parent completes enrollment | Intuitive, no assistance needed | High |
| USE-02 | Mobile responsiveness | Access system on mobile phone | All features accessible, readable | High |
| USE-03 | Error message clarity | Trigger validation errors | Messages clearly explain issue and fix | High |
| USE-04 | Navigation consistency | Navigate through all modules | Consistent layout, clear breadcrumbs | Medium |
| USE-05 | Form auto-save | Accidental page close during form fill | Warning shown, option to save | Medium |
| USE-06 | Accessibility - screen reader | Navigate with screen reader | All elements properly labeled | Medium |
| USE-07 | Loading indicators | Perform slow operations | Loading spinners/progress shown | Medium |
| USE-08 | Success confirmations | Complete any action | Clear success message displayed | Medium |

---

## Integration Test Cases

| Test ID | Scenario | Steps | Expected Result | Priority |
|---------|----------|-------|-----------------|----------|
| INT-01 | Database connection | Start application | MongoDB Atlas connected | Critical |
| INT-02 | Cloudinary integration | Upload document | File stored in Cloudinary | Critical |
| INT-03 | Email service (SMTP) | Trigger notification | Email sent and received | High |
| INT-04 | NextAuth session | Login, perform actions | Session maintained correctly | Critical |
| INT-05 | Vercel deployment | Deploy to Vercel | Application accessible | Critical |
| INT-06 | Environment variables | Deploy with production env | All services connect correctly | Critical |

---

## Test Data Requirements

### Users (Pre-populated for Testing)

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| admin@ctkschool.edu.ph | CTKAdmin2024! | admin | Admin testing |
| registrar@ctkschool.edu.ph | CTKReg2024! | registrar | Registrar testing |
| parent1@test.com | Parent123! | parent | Parent with 2 children |
| parent2@test.com | Parent123! | parent | Parent with 1 child |
| newparent@test.com | Parent123! | parent | Parent with no children |

### Students (Pre-populated)

- 10 students across different grade levels
- Mix of new, returning, and transferee types
- Various enrollment statuses

### Documents (Test Files)

- Valid PDF (< 5MB)
- Valid JPG/PNG (< 2MB)
- Oversized file (> 5MB)
- Invalid file type (.exe, .doc)

---

## Test Execution Checklist

### Pre-Deployment

- [ ] All critical and high priority tests pass
- [ ] Security tests pass
- [ ] Performance meets requirements
- [ ] Mobile responsiveness verified

### Post-Deployment

- [ ] Production environment smoke test
- [ ] Email notifications working
- [ ] Document uploads functional
- [ ] Database operations working
- [ ] User authentication functional

---

*Last Updated: March 2024*
*Version: 1.0*
