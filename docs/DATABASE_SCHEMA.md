# Database Schema Specification

## CTK EnrollSys - MongoDB Collections

This document provides the technical specification for all database collections used in the CTK EnrollSys application.

---

## Table of Contents

1. [Users Collection](#1-users-collection)
2. [Students Collection](#2-students-collection)
3. [Enrollments Collection](#3-enrollments-collection)
4. [Payments Collection](#4-payments-collection)
5. [School Years Collection](#5-school-years-collection)
6. [Fee Structures Collection](#6-fee-structures-collection)
7. [Documents Collection](#7-documents-collection)
8. [Audit Logs Collection](#8-audit-logs-collection)
9. [Notifications Collection](#9-notifications-collection)
10. [Indexes](#10-indexes)
11. [Relationships Diagram](#11-relationships-diagram)

---

## 1. Users Collection

Stores all user accounts for authentication and authorization.

```typescript
interface IUser {
  _id: ObjectId;
  email: string;                    // Unique, indexed
  password: string;                 // Hashed with bcrypt
  role: 'admin' | 'registrar' | 'parent';
  profile: {
    firstName: string;
    lastName: string;
    middleName?: string;
    contactNumber: string;
    address?: string;
  };
  isActive: boolean;                // Soft delete flag
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  lastLogin?: Date;
  failedLoginAttempts: number;
  lockoutUntil?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Sample Document

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "juan.delacruz@email.com",
  "password": "$2b$10$...",
  "role": "parent",
  "profile": {
    "firstName": "Juan",
    "lastName": "Dela Cruz",
    "middleName": "Santos",
    "contactNumber": "09171234567",
    "address": "123 Rizal St., Olongapo City"
  },
  "isActive": true,
  "isEmailVerified": true,
  "failedLoginAttempts": 0,
  "lastLogin": "2024-03-15T08:30:00Z",
  "createdAt": "2024-01-10T10:00:00Z",
  "updatedAt": "2024-03-15T08:30:00Z"
}
```

---

## 2. Students Collection

Master records for all students enrolled in the school.

```typescript
interface IStudent {
  _id: ObjectId;
  studentId: string;                // School-assigned ID (e.g., "2024-00001")
  lrn?: string;                     // Learner Reference Number (12 digits)
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName?: string;
    suffix?: string;                // Jr., Sr., III, etc.
    birthDate: Date;
    birthPlace: string;
    gender: 'male' | 'female';
    nationality: string;
    religion?: string;
    motherTongue?: string;
  };
  contactInfo: {
    address: {
      street: string;
      barangay: string;
      city: string;
      province: string;
      zipCode: string;
    };
    contactNumber?: string;
    email?: string;
  };
  guardianInfo: {
    father?: {
      fullName: string;
      occupation?: string;
      contactNumber?: string;
      email?: string;
    };
    mother?: {
      fullName: string;
      occupation?: string;
      contactNumber?: string;
      email?: string;
    };
    guardian?: {
      fullName: string;
      relationship: string;
      occupation?: string;
      contactNumber: string;
      email?: string;
    };
  };
  parentUserId?: ObjectId;          // Reference to parent's user account
  currentGradeLevel?: string;       // Current enrolled grade
  section?: string;                 // Current section assignment
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  enrollmentHistory: ObjectId[];    // References to enrollments
  medicalInfo?: {
    bloodType?: string;
    allergies?: string[];
    conditions?: string[];
    emergencyContact: {
      name: string;
      relationship: string;
      contactNumber: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Sample Document

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "studentId": "2024-00001",
  "lrn": "123456789012",
  "personalInfo": {
    "firstName": "Maria",
    "lastName": "Dela Cruz",
    "middleName": "Santos",
    "birthDate": "2015-05-15T00:00:00Z",
    "birthPlace": "Olongapo City",
    "gender": "female",
    "nationality": "Filipino",
    "religion": "Roman Catholic",
    "motherTongue": "Tagalog"
  },
  "contactInfo": {
    "address": {
      "street": "123 Rizal St.",
      "barangay": "East Bajac-Bajac",
      "city": "Olongapo City",
      "province": "Zambales",
      "zipCode": "2200"
    },
    "contactNumber": "09171234567"
  },
  "guardianInfo": {
    "father": {
      "fullName": "Juan Dela Cruz",
      "occupation": "Engineer",
      "contactNumber": "09171234567"
    },
    "mother": {
      "fullName": "Maria Clara Dela Cruz",
      "occupation": "Teacher",
      "contactNumber": "09179876543"
    }
  },
  "parentUserId": "507f1f77bcf86cd799439011",
  "currentGradeLevel": "Grade 3",
  "section": "St. Peter",
  "status": "active",
  "enrollmentHistory": ["507f1f77bcf86cd799439020"],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-03-01T14:30:00Z"
}
```

---

## 3. Enrollments Collection

Tracks enrollment applications for each school year.

```typescript
interface IEnrollment {
  _id: ObjectId;
  enrollmentNumber: string;         // Auto-generated (e.g., "ENR-2024-00001")
  studentId: ObjectId;              // Reference to student
  schoolYearId: ObjectId;           // Reference to school year
  enrollmentType: 'new' | 'old' | 'transferee' | 'returning';
  gradeLevel: string;               // Grade applying for
  previousSchool?: {
    name: string;
    address: string;
    lastGradeCompleted: string;
    schoolYear: string;
  };
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'waitlisted' | 'enrolled';
  statusHistory: {
    status: string;
    changedBy: ObjectId;            // User who changed status
    changedAt: Date;
    remarks?: string;
  }[];
  documents: {
    type: 'psa_birth_certificate' | 'report_card' | 'id_photo' | 'good_moral' | 'transfer_certificate' | 'medical_certificate' | 'other';
    documentId: ObjectId;           // Reference to documents collection
    status: 'pending' | 'verified' | 'rejected';
    remarks?: string;
  }[];
  assessedFees?: {
    feeStructureId: ObjectId;
    totalAmount: number;
    breakdown: {
      description: string;
      amount: number;
    }[];
  };
  submittedBy: ObjectId;            // Parent user who submitted
  processedBy?: ObjectId;           // Registrar who processed
  enrollmentDate?: Date;            // Date when enrollment was confirmed
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Sample Document

```json
{
  "_id": "507f1f77bcf86cd799439020",
  "enrollmentNumber": "ENR-2024-00001",
  "studentId": "507f1f77bcf86cd799439012",
  "schoolYearId": "507f1f77bcf86cd799439030",
  "enrollmentType": "old",
  "gradeLevel": "Grade 3",
  "status": "approved",
  "statusHistory": [
    {
      "status": "pending",
      "changedBy": "507f1f77bcf86cd799439011",
      "changedAt": "2024-03-01T10:00:00Z"
    },
    {
      "status": "under_review",
      "changedBy": "507f1f77bcf86cd799439015",
      "changedAt": "2024-03-02T09:00:00Z"
    },
    {
      "status": "approved",
      "changedBy": "507f1f77bcf86cd799439015",
      "changedAt": "2024-03-03T11:00:00Z",
      "remarks": "All documents verified"
    }
  ],
  "documents": [
    {
      "type": "psa_birth_certificate",
      "documentId": "507f1f77bcf86cd799439040",
      "status": "verified"
    },
    {
      "type": "report_card",
      "documentId": "507f1f77bcf86cd799439041",
      "status": "verified"
    },
    {
      "type": "id_photo",
      "documentId": "507f1f77bcf86cd799439042",
      "status": "verified"
    }
  ],
  "assessedFees": {
    "feeStructureId": "507f1f77bcf86cd799439050",
    "totalAmount": 25000,
    "breakdown": [
      { "description": "Tuition Fee", "amount": 18000 },
      { "description": "Miscellaneous Fee", "amount": 5000 },
      { "description": "Books and Materials", "amount": 2000 }
    ]
  },
  "submittedBy": "507f1f77bcf86cd799439011",
  "processedBy": "507f1f77bcf86cd799439015",
  "enrollmentDate": "2024-03-05T00:00:00Z",
  "createdAt": "2024-03-01T10:00:00Z",
  "updatedAt": "2024-03-05T14:00:00Z"
}
```

---

## 4. Payments Collection

Records all payment transactions.

```typescript
interface IPayment {
  _id: ObjectId;
  receiptNumber: string;            // Official receipt number
  enrollmentId: ObjectId;           // Reference to enrollment
  studentId: ObjectId;              // Reference to student
  schoolYearId: ObjectId;           // Reference to school year
  paymentType: 'tuition' | 'miscellaneous' | 'other';
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'gcash' | 'other';
  paymentDetails?: {
    checkNumber?: string;
    bankName?: string;
    referenceNumber?: string;
  };
  receivedBy: ObjectId;             // Registrar who received payment
  paymentDate: Date;
  remarks?: string;
  isVoided: boolean;
  voidedBy?: ObjectId;
  voidedAt?: Date;
  voidReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Sample Document

```json
{
  "_id": "507f1f77bcf86cd799439060",
  "receiptNumber": "OR-2024-00001",
  "enrollmentId": "507f1f77bcf86cd799439020",
  "studentId": "507f1f77bcf86cd799439012",
  "schoolYearId": "507f1f77bcf86cd799439030",
  "paymentType": "tuition",
  "description": "First Quarter Payment",
  "amount": 6250,
  "paymentMethod": "cash",
  "receivedBy": "507f1f77bcf86cd799439015",
  "paymentDate": "2024-03-10T10:30:00Z",
  "isVoided": false,
  "createdAt": "2024-03-10T10:30:00Z",
  "updatedAt": "2024-03-10T10:30:00Z"
}
```

---

## 5. School Years Collection

Manages academic year configuration.

```typescript
interface ISchoolYear {
  _id: ObjectId;
  name: string;                     // e.g., "2024-2025"
  startDate: Date;
  endDate: Date;
  enrollmentPeriod: {
    start: Date;
    end: Date;
  };
  gradeLevels: string[];            // Available grade levels
  status: 'upcoming' | 'enrollment' | 'ongoing' | 'completed';
  isActive: boolean;                // Currently active school year
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### Sample Document

```json
{
  "_id": "507f1f77bcf86cd799439030",
  "name": "2024-2025",
  "startDate": "2024-08-05T00:00:00Z",
  "endDate": "2025-05-30T00:00:00Z",
  "enrollmentPeriod": {
    "start": "2024-03-01T00:00:00Z",
    "end": "2024-07-31T00:00:00Z"
  },
  "gradeLevels": [
    "Kinder 1",
    "Kinder 2",
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10"
  ],
  "status": "enrollment",
  "isActive": true,
  "createdBy": "507f1f77bcf86cd799439001",
  "createdAt": "2024-02-01T10:00:00Z",
  "updatedAt": "2024-03-01T08:00:00Z"
}
```

---

## 6. Fee Structures Collection

Defines fee schedules per grade level.

```typescript
interface IFeeStructure {
  _id: ObjectId;
  schoolYearId: ObjectId;           // Reference to school year
  gradeLevel: string;
  fees: {
    category: 'tuition' | 'miscellaneous' | 'books' | 'uniform' | 'other';
    description: string;
    amount: number;
    isRequired: boolean;
  }[];
  totalAmount: number;
  paymentOptions: {
    type: 'annual' | 'semi_annual' | 'quarterly' | 'monthly';
    installments: number;
    discount?: number;              // Percentage discount
    dueDate?: string;               // Pattern like "every 5th of month"
  }[];
  scholarshipDiscounts?: {
    type: string;
    percentage: number;
    requirements?: string;
  }[];
  isActive: boolean;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### Sample Document

```json
{
  "_id": "507f1f77bcf86cd799439050",
  "schoolYearId": "507f1f77bcf86cd799439030",
  "gradeLevel": "Grade 3",
  "fees": [
    {
      "category": "tuition",
      "description": "Tuition Fee",
      "amount": 18000,
      "isRequired": true
    },
    {
      "category": "miscellaneous",
      "description": "Miscellaneous Fee",
      "amount": 5000,
      "isRequired": true
    },
    {
      "category": "books",
      "description": "Books and Materials",
      "amount": 2000,
      "isRequired": true
    }
  ],
  "totalAmount": 25000,
  "paymentOptions": [
    {
      "type": "annual",
      "installments": 1,
      "discount": 5
    },
    {
      "type": "semi_annual",
      "installments": 2,
      "discount": 3
    },
    {
      "type": "quarterly",
      "installments": 4,
      "discount": 0
    }
  ],
  "isActive": true,
  "createdBy": "507f1f77bcf86cd799439001",
  "createdAt": "2024-02-15T10:00:00Z",
  "updatedAt": "2024-02-15T10:00:00Z"
}
```

---

## 7. Documents Collection

Stores metadata for uploaded documents.

```typescript
interface IDocument {
  _id: ObjectId;
  studentId: ObjectId;              // Reference to student
  enrollmentId?: ObjectId;          // Reference to enrollment (if uploaded during enrollment)
  documentType: 'psa_birth_certificate' | 'report_card' | 'id_photo' | 'good_moral' | 'transfer_certificate' | 'medical_certificate' | 'form_137' | 'other';
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;                 // In bytes
  cloudinaryUrl: string;            // Cloudinary secure URL
  cloudinaryPublicId: string;       // For deletion/management
  uploadedBy: ObjectId;             // User who uploaded
  verifiedBy?: ObjectId;            // Registrar who verified
  verifiedAt?: Date;
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Sample Document

```json
{
  "_id": "507f1f77bcf86cd799439040",
  "studentId": "507f1f77bcf86cd799439012",
  "enrollmentId": "507f1f77bcf86cd799439020",
  "documentType": "psa_birth_certificate",
  "fileName": "psa_maria_delacruz.pdf",
  "originalName": "birth_certificate_scan.pdf",
  "mimeType": "application/pdf",
  "fileSize": 524288,
  "cloudinaryUrl": "https://res.cloudinary.com/ctk-enrollsys/...",
  "cloudinaryPublicId": "ctk-enrollsys/documents/psa_abc123",
  "uploadedBy": "507f1f77bcf86cd799439011",
  "verifiedBy": "507f1f77bcf86cd799439015",
  "verifiedAt": "2024-03-02T10:00:00Z",
  "status": "verified",
  "createdAt": "2024-03-01T10:15:00Z",
  "updatedAt": "2024-03-02T10:00:00Z"
}
```

---

## 8. Audit Logs Collection

Tracks all system activities for security and compliance.

```typescript
interface IAuditLog {
  _id: ObjectId;
  userId: ObjectId;                 // User who performed action
  userEmail: string;                // Denormalized for quick reference
  userRole: string;
  action: string;                   // e.g., "enrollment.approve", "payment.create"
  resource: string;                 // Collection name
  resourceId?: ObjectId;            // Document ID affected
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;   // Additional context
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```

### Sample Document

```json
{
  "_id": "507f1f77bcf86cd799439070",
  "userId": "507f1f77bcf86cd799439015",
  "userEmail": "registrar@ctkschool.edu.ph",
  "userRole": "registrar",
  "action": "enrollment.approve",
  "resource": "enrollments",
  "resourceId": "507f1f77bcf86cd799439020",
  "changes": [
    {
      "field": "status",
      "oldValue": "under_review",
      "newValue": "approved"
    }
  ],
  "metadata": {
    "remarks": "All documents verified"
  },
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2024-03-03T11:00:00Z"
}
```

---

## 9. Notifications Collection

Stores in-app notifications for users.

```typescript
interface INotification {
  _id: ObjectId;
  userId: ObjectId;                 // Recipient user
  type: 'enrollment_status' | 'payment_reminder' | 'document_verified' | 'announcement' | 'system';
  title: string;
  message: string;
  link?: string;                    // URL to related page
  isRead: boolean;
  readAt?: Date;
  emailSent: boolean;
  emailSentAt?: Date;
  createdAt: Date;
}
```

### Sample Document

```json
{
  "_id": "507f1f77bcf86cd799439080",
  "userId": "507f1f77bcf86cd799439011",
  "type": "enrollment_status",
  "title": "Enrollment Approved",
  "message": "Your enrollment application for Maria Dela Cruz (Grade 3) has been approved.",
  "link": "/parent/enrollments/507f1f77bcf86cd799439020",
  "isRead": false,
  "emailSent": true,
  "emailSentAt": "2024-03-03T11:01:00Z",
  "createdAt": "2024-03-03T11:00:00Z"
}
```

---

## 10. Indexes

### Recommended Indexes for Performance

```javascript
// Users Collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1, isActive: 1 });

// Students Collection
db.students.createIndex({ studentId: 1 }, { unique: true });
db.students.createIndex({ lrn: 1 }, { sparse: true });
db.students.createIndex({ "personalInfo.lastName": 1, "personalInfo.firstName": 1 });
db.students.createIndex({ parentUserId: 1 });
db.students.createIndex({ status: 1, currentGradeLevel: 1 });

// Enrollments Collection
db.enrollments.createIndex({ enrollmentNumber: 1 }, { unique: true });
db.enrollments.createIndex({ studentId: 1, schoolYearId: 1 });
db.enrollments.createIndex({ status: 1 });
db.enrollments.createIndex({ schoolYearId: 1, status: 1 });
db.enrollments.createIndex({ submittedBy: 1 });

// Payments Collection
db.payments.createIndex({ receiptNumber: 1 }, { unique: true });
db.payments.createIndex({ studentId: 1, schoolYearId: 1 });
db.payments.createIndex({ enrollmentId: 1 });
db.payments.createIndex({ paymentDate: -1 });

// School Years Collection
db.schoolYears.createIndex({ isActive: 1 });
db.schoolYears.createIndex({ status: 1 });

// Fee Structures Collection
db.feeStructures.createIndex({ schoolYearId: 1, gradeLevel: 1 });

// Documents Collection
db.documents.createIndex({ studentId: 1 });
db.documents.createIndex({ enrollmentId: 1 });
db.documents.createIndex({ status: 1 });

// Audit Logs Collection
db.auditLogs.createIndex({ userId: 1, createdAt: -1 });
db.auditLogs.createIndex({ resource: 1, resourceId: 1 });
db.auditLogs.createIndex({ createdAt: -1 });

// Notifications Collection
db.notifications.createIndex({ userId: 1, isRead: 1, createdAt: -1 });
```

---

## 11. Relationships Diagram

```
                                    ┌──────────────────┐
                                    │    schoolYears   │
                                    └────────┬─────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
          ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
          │  feeStructures  │      │   enrollments   │      │    payments     │
          └─────────────────┘      └────────┬────────┘      └────────┬────────┘
                                            │                        │
                                            │                        │
                    ┌───────────────────────┼────────────────────────┤
                    │                       │                        │
                    ▼                       ▼                        │
          ┌─────────────────┐      ┌─────────────────┐               │
          │    documents    │◄─────│    students     │◄──────────────┘
          └─────────────────┘      └────────┬────────┘
                    ▲                       │
                    │                       │
                    │                       ▼
                    │              ┌─────────────────┐
                    │              │     users       │
                    │              │   (parents)     │
                    │              └────────┬────────┘
                    │                       │
                    └───────────────────────┘
                           uploadedBy

          ┌─────────────────┐      ┌─────────────────┐
          │   auditLogs     │      │  notifications  │
          │  (references    │      │  (references    │
          │   all entities) │      │   users)        │
          └─────────────────┘      └─────────────────┘
```

---

## Data Validation Rules

### Required Fields by Collection

| Collection | Required Fields |
|------------|-----------------|
| users | email, password, role, profile.firstName, profile.lastName, profile.contactNumber |
| students | studentId, personalInfo (firstName, lastName, birthDate, birthPlace, gender, nationality), contactInfo.address |
| enrollments | enrollmentNumber, studentId, schoolYearId, enrollmentType, gradeLevel, status, submittedBy |
| payments | receiptNumber, enrollmentId, studentId, schoolYearId, paymentType, amount, paymentMethod, receivedBy, paymentDate |
| schoolYears | name, startDate, endDate, enrollmentPeriod, gradeLevels, status |
| feeStructures | schoolYearId, gradeLevel, fees, totalAmount |
| documents | studentId, documentType, fileName, mimeType, fileSize, cloudinaryUrl, cloudinaryPublicId, uploadedBy, status |

### Field Constraints

- **LRN**: Exactly 12 digits
- **Email**: Valid email format
- **Contact Number**: Philippine format (09XXXXXXXXX or +639XXXXXXXXX)
- **File Size**: Maximum 5MB for documents, 2MB for photos
- **Password**: Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number

---

*Last Updated: March 2024*
*Version: 1.0*
