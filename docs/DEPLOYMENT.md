# Deployment Guide

## CTK EnrollSys - Vercel & MongoDB Atlas Deployment

This guide covers deploying CTK EnrollSys using free tiers of Vercel and MongoDB Atlas, suitable for the academic capstone project.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [MongoDB Atlas Setup](#mongodb-atlas-setup)
3. [Cloudinary Setup](#cloudinary-setup)
4. [SMTP Email Setup](#smtp-email-setup)
5. [Vercel Deployment](#vercel-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Free Tier Limitations](#free-tier-limitations)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)

---

## Prerequisites

Before deployment, ensure you have:

- [ ] GitHub account with repository access
- [ ] Vercel account (free tier)
- [ ] MongoDB Atlas account (free tier)
- [ ] Cloudinary account (free tier)
- [ ] SMTP email account (Gmail or Outlook)
- [ ] Project code pushed to GitHub

---

## MongoDB Atlas Setup

### Step 1: Create Account & Cluster

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Sign up for free account
3. Create new project: "CTK EnrollSys"

### Step 2: Create Free M0 Cluster

1. Click "Build a Database"
2. Select **M0 FREE** tier
3. Provider: AWS
4. Region: Select closest to Philippines (Singapore recommended)
5. Cluster Name: `ctk-cluster`
6. Click "Create Cluster"

### Step 3: Database Access

1. Go to **Database Access** in sidebar
2. Click "Add New Database User"
3. Authentication: Password
4. Username: `ctk_admin`
5. Password: Generate secure password (save this!)
6. Database User Privileges: Read and Write to Any Database
7. Click "Add User"

### Step 4: Network Access

1. Go to **Network Access** in sidebar
2. Click "Add IP Address"
3. For development: "Add Current IP Address"
4. For Vercel production: "Allow Access from Anywhere" (0.0.0.0/0)
   - Note: MongoDB Atlas has additional security layers
5. Click "Confirm"

### Step 5: Get Connection String

1. Go to **Database** > Click "Connect" on your cluster
2. Select "Connect your application"
3. Driver: Node.js, Version: 5.5 or later
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Add database name: `ctk-enrollsys`

```
mongodb+srv://ctk_admin:<password>@ctk-cluster.xxxxx.mongodb.net/ctk-enrollsys?retryWrites=true&w=majority
```

---

## Cloudinary Setup

### Step 1: Create Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for free account
3. Select "Programmable Media" when asked

### Step 2: Get Credentials

1. Go to Dashboard
2. Copy these values:
   - Cloud Name
   - API Key
   - API Secret

### Step 3: Create Upload Preset (Optional)

1. Go to Settings > Upload
2. Add upload preset for unsigned uploads
3. Folder: `ctk-enrollsys/documents`
4. Enable "Use filename or externally defined public ID"

---

## SMTP Email Setup

### Step 1: Create Account

1. Use an email account you control (recommended: Gmail).
2. Enable 2-Step Verification on that account.
3. Generate an App Password for SMTP.

### Step 2: SMTP Configuration

Use these values (Gmail):

| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | your Gmail address |
| `SMTP_PASS` | your App Password |
| `EMAIL_FROM` | `CTK EnrollSys <your-email@gmail.com>` |

**Note:** This works without owning a custom domain. For school-wide production volume, use a managed domain SMTP account later.

---

## Vercel Deployment

### Step 1: Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "Add New Project"
4. Import your `ctk-enrollsys` repository
5. Select the repository from the list

### Step 2: Configure Project

1. Framework Preset: Next.js (auto-detected)
2. Root Directory: `./` (default)
3. Build Command: `npm run build` (default)
4. Output Directory: `.next` (default)

### Step 3: Environment Variables

Add all environment variables before deploying:

Click "Environment Variables" and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `MONGODB_URI` | mongodb+srv://... | Production, Preview, Development |
| `NEXTAUTH_URL` | https://your-app.vercel.app | Production |
| `NEXTAUTH_SECRET` | (generate with `openssl rand -base64 32`) | All |
| `CLOUDINARY_CLOUD_NAME` | your-cloud-name | All |
| `CLOUDINARY_API_KEY` | your-api-key | All |
| `CLOUDINARY_API_SECRET` | your-api-secret | All |
| `SMTP_HOST` | smtp.gmail.com | All |
| `SMTP_PORT` | 587 | All |
| `SMTP_SECURE` | false | All |
| `SMTP_USER` | your-email@gmail.com | All |
| `SMTP_PASS` | your-app-password | All |
| `EMAIL_FROM` | CTK EnrollSys <your-email@gmail.com> | All |
| `NEXT_PUBLIC_APP_URL` | https://your-app.vercel.app | Production |

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (2-5 minutes)
3. Note your deployment URL: `https://ctk-enrollsys.vercel.app`

### Step 5: Update NEXTAUTH_URL

After first deployment:
1. Go to Project Settings > Environment Variables
2. Update `NEXTAUTH_URL` with your actual Vercel URL
3. Redeploy

---

## Environment Configuration

### Complete `.env.local` Template

```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-generate-with-openssl

# MongoDB Atlas
MONGODB_URI=mongodb+srv://ctk_admin:your-password@ctk-cluster.xxxxx.mongodb.net/ctk-enrollsys?retryWrites=true&w=majority

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-api-secret

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=CTK EnrollSys <your-email@gmail.com>

# School Configuration
SCHOOL_NAME=Christ the King Catholic School
SCHOOL_ADDRESS=Olongapo City, Zambales
SCHOOL_CONTACT=+63 (47) 123-4567
```

### Generate NEXTAUTH_SECRET

```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## Post-Deployment Verification

### Deployment Checklist

Run through these checks after deployment:

| Check | URL/Action | Expected Result |
|-------|------------|-----------------|
| Homepage loads | `https://your-app.vercel.app` | Homepage displayed |
| Login page | `/login` | Login form displayed |
| Database connection | Try to login | No database errors |
| Create account | Register new user | Account created, can login |
| Document upload | Upload test file | File uploaded to Cloudinary |
| Email notification | Trigger action | Email received |
| Admin dashboard | Login as admin | Dashboard loads with data |

### Health Check Script

Create a simple API route to verify services:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const checks = {
    database: false,
    timestamp: new Date().toISOString()
  };
  
  try {
    // Test database connection
    await mongoose.connection.db.admin().ping();
    checks.database = true;
  } catch (error) {
    checks.database = false;
  }
  
  return Response.json(checks);
}
```

---

## Free Tier Limitations

### MongoDB Atlas M0 (Free)

| Resource | Limit |
|----------|-------|
| Storage | 512 MB |
| RAM | Shared |
| Connections | 500 max |
| Collections | No limit |
| Indexes | Recommended < 64 per collection |

**Recommendation:** Monitor storage usage; 512MB is sufficient for capstone demo with ~500-1000 students.

### Vercel Free (Hobby)

| Resource | Limit |
|----------|-------|
| Bandwidth | 100 GB/month |
| Serverless Function Execution | 100 GB-hours/month |
| Build Minutes | 6000 min/month |
| Deployments | Unlimited |
| Custom Domains | 1 (for production) |

**Recommendation:** Sufficient for capstone; consider Pro only if expecting high traffic.

### Cloudinary Free

| Resource | Limit |
|----------|-------|
| Storage | 25 GB |
| Monthly Bandwidth | 25 GB |
| Transformations | 25,000/month |

**Recommendation:** Enable automatic compression; 25GB storage is ample for document uploads.

### SMTP (Gmail Free)

| Resource | Limit |
|----------|-------|
| Emails | ~500/day (personal Gmail, subject to provider policy) |
| Domains | Not required |
| API Calls | No app-level limit in this project |

**Recommendation:** Good for capstone/demo traffic. For larger real deployment, switch to a school-managed SMTP/domain sender.

---

## Troubleshooting

### Common Issues

#### 1. "ECONNREFUSED" - Database Connection Error

**Cause:** MongoDB Atlas network access not configured
**Solution:**
1. Go to MongoDB Atlas > Network Access
2. Add `0.0.0.0/0` for Vercel deployment
3. Redeploy

#### 2. "Invalid API Key" - Cloudinary Error

**Cause:** Environment variables not set correctly
**Solution:**
1. Verify API Key and Secret in Cloudinary dashboard
2. Check for extra spaces in Vercel environment variables
3. Redeploy after fixing

#### 3. "NEXTAUTH_URL" Mismatch

**Cause:** URL doesn't match actual deployment URL
**Solution:**
1. Update `NEXTAUTH_URL` to match your Vercel URL exactly
2. Include `https://`
3. No trailing slash
4. Redeploy

#### 4. Build Failed - Module Not Found

**Cause:** Missing dependency or import error
**Solution:**
1. Check build logs in Vercel
2. Ensure all imports are correct
3. Run `npm run build` locally to verify
4. Push fix and redeploy

#### 5. Email Not Sending

**Cause:** SMTP credentials invalid or app password not configured
**Solution:**
1. Confirm `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` are correct
2. For Gmail, use App Password (not your normal account password)
3. Confirm `EMAIL_FROM` matches your SMTP sender account
4. Check Vercel function logs for SMTP auth errors

### Viewing Logs

1. Go to Vercel Dashboard > Your Project
2. Click "Deployments"
3. Select deployment > "Functions" tab
4. View real-time logs

---

## Maintenance

### Regular Tasks

| Task | Frequency | How |
|------|-----------|-----|
| Check storage usage | Monthly | MongoDB Atlas > Metrics |
| Review error logs | Weekly | Vercel > Deployments > Logs |
| Database backup | Automatic | MongoDB Atlas (daily snapshots) |
| Update dependencies | Monthly | `npm update`, test, deploy |

### Scaling Beyond Free Tier

If the school decides to continue using the system:

| Service | Upgrade Path | Cost |
|---------|-------------|------|
| MongoDB Atlas | M2 → M10 | $9 → $57/month |
| Vercel | Pro | $20/month |
| Cloudinary | Plus | $89/month |
| Email Provider | School SMTP / Managed SMTP | Depends on provider |

---

## Deployment Timeline

### Recommended Deployment Schedule

| Phase | Duration | Activities |
|-------|----------|------------|
| 1. Development | 8 weeks | Code, test locally |
| 2. Staging Deploy | 1 week | Deploy to Vercel preview, test with team |
| 3. UAT | 2 weeks | User acceptance testing with school staff |
| 4. Production | 1 week | Final deployment, training |
| 5. Support | Ongoing | Bug fixes, minor enhancements |

### Go-Live Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database seeded with initial data
- [ ] Admin account created
- [ ] Registrar accounts created
- [ ] Email templates finalized
- [ ] User training completed
- [ ] Backup strategy documented
- [ ] Support contact established

---

*Last Updated: March 2024*
*Version: 1.0*
