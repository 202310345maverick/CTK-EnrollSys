# CTK EnrollSys

**Christ the King Catholic School - Enrollment and Records Management System**

A web-based enrollment and records management system developed as a capstone project for Christ the King Catholic School, Olongapo City. The system digitizes the traditionally paper-based enrollment process, improving efficiency and data security.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [User Roles](#user-roles)
- [Feature and QA Tracker](#feature-and-qa-tracker)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributors](#contributors)
- [License](#license)

## 🎯 Overview

### Problem Statement

Christ the King Catholic School currently operates with a fully manual, paper-based enrollment system that results in:

- **Long queues** during enrollment periods
- **Risk of data loss** from physical document storage
- **Manual encoding errors** in student records
- **Slow retrieval** of student information
- **High administrative workload** for registrar staff

### Solution

CTK EnrollSys addresses these challenges by providing:

- Online enrollment submission with document uploads
- Centralized digital student records
- Automated fee assessment
- Real-time enrollment status tracking
- Role-based access for secure data management
- DepEd-compliant report generation

## ✨ Features

### Core Modules

| Module | Description |
|--------|-------------|
| **Online Enrollment** | Digital enrollment forms with document upload (PSA, Report Card, ID Photos) |
| **Student Records Management** | Centralized database for student information with search and filter |
| **Fee Assessment & Payment Logging** | Automated fee computation and manual payment recording |
| **Report Generation** | DepEd-compliant reports (SF1, SF2, etc.) with PDF/Excel export |
| **Role-Based Access Control** | Secure access levels for Admin, Registrar, and Parent users |
| **Email Notifications** | Automated notifications for enrollment status updates |

### By User Role

**Admin**
- User management (create, update, deactivate accounts)
- System configuration (school year, fee structures, grade levels)
- Dashboard analytics and reports
- Audit logs

**Registrar**
- Process enrollment applications
- Manage student records
- Log payments and assess fees
- Generate reports

**Parent**
- Submit online enrollment
- Upload required documents
- Track enrollment status
- View payment history

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
│                    React Components + Next.js                       │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ HTTPS
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE NETWORK                            │
│              (CDN, Edge Functions, Serverless)                      │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Pages/    │  │    API      │  │ Middleware  │                 │
│  │   App Dir   │  │   Routes    │  │   (Auth)    │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    SERVICE LAYER                             │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │   │
│  │  │ Auth     │ │Enrollment│ │ Student  │ │ Payment  │        │   │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │        │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  MongoDB Atlas  │    │   Cloudinary    │    │      SMTP       │
│   (Database)    │    │ (File Storage)  │    │    (Email)      │
│                 │    │                 │    │                 │
│ • users         │    │ • Documents     │    │ • Notifications │
│ • students      │    │ • ID Photos     │    │ • Status Updates│
│ • enrollments   │    │ • Report Cards  │    │                 │
│ • payments      │    │                 │    │                 │
│ • schoolYears   │    │                 │    │                 │
│ • feeStructures │    │                 │    │                 │
│ • auditLogs     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Breakdown

| Layer | Components | Technology |
|-------|------------|------------|
| **Presentation** | UI Components, Forms, Tables, Charts | React, Tailwind CSS, shadcn/ui |
| **Application** | Page Routing, API Handlers, Middleware | Next.js 14 App Router |
| **Business Logic** | Services, Validation, Computations | TypeScript |
| **Data Access** | Database Models, Queries | Mongoose ODM |
| **External Services** | File Storage, Email | Cloudinary, SMTP |
| **Infrastructure** | Hosting, Database, CDN | Vercel, MongoDB Atlas |

## 🛠️ Tech Stack

| Category | Technology | Rationale |
|----------|------------|-----------|
| **Framework** | Next.js 14 | Full-stack React with API routes, SSR/SSG support |
| **Language** | TypeScript | Type safety, better developer experience |
| **Database** | MongoDB Atlas | Flexible schema, free tier available, easy scaling |
| **ODM** | Mongoose | Schema validation, middleware support |
| **Styling** | Tailwind CSS | Utility-first, rapid development |
| **UI Components** | shadcn/ui | Accessible, customizable components |
| **Authentication** | NextAuth.js | Secure session management, multiple providers |
| **File Upload** | Cloudinary | Free tier, image optimization, secure URLs |
| **Email** | SMTP (Nodemailer) | Works with Gmail/Outlook and other SMTP providers |
| **Forms** | React Hook Form + Zod | Performance, validation |
| **Deployment** | Vercel | Zero-config, free tier, edge functions |

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- MongoDB Atlas account (free tier)
- Cloudinary account (free tier)
- SMTP email account (Gmail/Outlook)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ctk-enrollsys.git
   cd ctk-enrollsys
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your credentials (see [Environment Variables](#environment-variables))

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### First-Time Setup

1. The system will auto-create a default admin account on first run
2. Default credentials: `admin@ctkschool.edu.ph` / `CTKAdmin2024!`
3. **Change the password immediately** after first login

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-generate-with-openssl

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ctk-enrollsys

# Cloudinary (File Uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# SMTP Email (Gmail/Outlook/Any SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=CTK EnrollSys <your-email@gmail.com>

# Authentication Security
NEXT_PUBLIC_SESSION_IDLE_TIMEOUT_MINUTES=30
AUTH_MAX_FAILED_LOGIN_ATTEMPTS=5
AUTH_LOCKOUT_MINUTES=15
AUTH_PASSWORD_RESET_TOKEN_TTL_MINUTES=60
AUTH_EMAIL_VERIFICATION_TOKEN_TTL_MINUTES=1440

# Optional: School Configuration
SCHOOL_NAME=Christ the King Catholic School
SCHOOL_ADDRESS=Olongapo City, Zambales
```

## 📊 Database Schema

### Collections Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE: ctk-enrollsys                    │
├─────────────────────────────────────────────────────────────────┤
│  users            │ User accounts and authentication           │
│  students         │ Student master records                      │
│  enrollments      │ Enrollment applications per school year    │
│  payments         │ Payment transactions                        │
│  schoolYears      │ Academic year configuration                │
│  feeStructures    │ Fee schedules per grade level              │
│  documents        │ Uploaded document metadata                  │
│  auditLogs        │ System activity tracking                   │
│  notifications    │ In-app notifications                       │
└─────────────────────────────────────────────────────────────────┘
```

See [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for detailed schema specifications.

## 👥 User Roles

| Role | Access Level | Primary Functions |
|------|--------------|-------------------|
| **Admin** | Full system access | User management, configuration, reports |
| **Registrar** | Student & enrollment management | Process enrollments, manage records |
| **Parent** | Limited to own children | Submit enrollment, view status |

## ✅ Feature and QA Tracker

Use the master tracker document for feature coverage, QA execution, and daily progress logging:

- [Feature Checklist and QA Tracker](docs/FEATURES_QA_TRACKER.md)

## 📁 Project Structure

```
ctk-enrollsys/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   │   ├── admin/         # Admin-only pages
│   │   │   ├── registrar/     # Registrar pages
│   │   │   └── parent/        # Parent pages
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── forms/            # Form components
│   │   └── shared/           # Shared components
│   ├── lib/                   # Utility functions
│   │   ├── db/               # Database utilities
│   │   ├── auth/             # Auth utilities
│   │   └── utils/            # General utilities
│   ├── models/               # Mongoose models
│   ├── services/             # Business logic
│   ├── types/                # TypeScript types
│   └── validations/          # Zod schemas
├── public/                    # Static assets
├── docs/                      # Documentation
├── tests/                     # Test files
└── ...config files
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Key Test Scenarios

1. **Enrollment Processing** - Submit, review, approve/reject flow
2. **Document Upload** - File validation, size limits, secure storage
3. **Payment Logging** - Fee computation, payment recording
4. **Report Generation** - Data accuracy, export functionality
5. **Access Control** - Role-based permissions

## 🚢 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to `main` branch

### MongoDB Atlas Setup

1. Create a free M0 cluster
2. Create database user with read/write access
3. Whitelist Vercel IP addresses (or use 0.0.0.0/0 for development)
4. Get connection string and add to environment variables

## 📖 Documentation

- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Feature Checklist and QA Tracker](docs/FEATURES_QA_TRACKER.md)
- [API Reference](docs/API_REFERENCE.md)
- [User Guide - Admin](docs/USER_GUIDE_ADMIN.md)
- [User Guide - Registrar](docs/USER_GUIDE_REGISTRAR.md)
- [User Guide - Parent](docs/USER_GUIDE_PARENT.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 👨‍💻 Contributors

- **Maverick Lance Coronel** - Lead Developer
- [Add team members]

## 📄 License

This project is developed for academic purposes as a capstone project for Christ the King Catholic School.

---

**CTK EnrollSys** © 2024 - Developed with ❤️ for Christ the King Catholic School, Olongapo City
