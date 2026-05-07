# CTK EnrollSys — Backup & Restore Procedures

## Overview

All application data lives in **MongoDB Atlas** (cloud-hosted). Cloudinary stores uploaded documents. This document covers backup, restore, and environment variable recovery.

---

## 1. Database Backup (MongoDB Atlas)

### Automatic Cloud Backups (Recommended for Production)

MongoDB Atlas provides **continuous cloud backups** on M10+ tiers. For the free/shared tier (M0), use the manual `mongodump` approach below.

**To enable Atlas Cloud Backups:**
1. Go to Atlas Dashboard → your cluster → **Backup**
2. Enable **Continuous Cloud Backup** (M10+) or **Cloud Backup** schedule
3. Set retention: Daily for 7 days, Weekly for 4 weeks, Monthly for 12 months

### Manual Backup via Script

```bash
# Set your URI from Vercel dashboard or .env.local
export MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/ctk-enrollsys"

# Run the backup (creates a timestamped .tar.gz in ./backups/)
bash scripts/backup.sh
```

The script:
- Runs `mongodump --uri` to dump all collections
- Compresses to `backups/ctk_enrollsys_YYYYMMDD_HHmmss.tar.gz`
- Auto-deletes backups older than 30 days

### Scheduled Backup via Cron (Linux/macOS server)

```bash
# Edit crontab
crontab -e

# Add: run backup daily at 2 AM
0 2 * * * MONGODB_URI="mongodb+srv://..." bash /path/to/scripts/backup.sh >> /var/log/ctk-backup.log 2>&1
```

### GitHub Actions Scheduled Backup

Create `.github/workflows/backup.yml`:

```yaml
name: Daily Database Backup
on:
  schedule:
    - cron: "0 18 * * *"  # 2 AM PHT (UTC+8 = 18:00 UTC)
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install mongodump
        run: |
          wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
          echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
          sudo apt-get update && sudo apt-get install -y mongodb-database-tools
      - name: Run backup
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
        run: bash scripts/backup.sh
      - name: Upload backup artifact
        uses: actions/upload-artifact@v4
        with:
          name: db-backup-${{ github.run_id }}
          path: backups/*.tar.gz
          retention-days: 30
```

---

## 2. Database Restore

```bash
export MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/ctk-enrollsys"

# Restore from a specific backup file
bash scripts/restore.sh backups/ctk_enrollsys_20260101_020000.tar.gz
```

> ⚠️ **WARNING:** The restore script uses `--drop` which drops existing collections before restoring. Only run on a staging environment first to verify the backup is valid.

---

## 3. Environment Variables Backup

All required env vars are stored in **Vercel Dashboard → Settings → Environment Variables**. If you need to recover them:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → your project → **Settings → Environment Variables**
2. Copy all values to a secure password manager (1Password, Bitwarden, etc.)

**Required variables (back these up):**
```
MONGODB_URI
NEXTAUTH_SECRET
NEXTAUTH_URL
NEXT_PUBLIC_APP_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASS
EMAIL_FROM
NEXT_PUBLIC_SENTRY_DSN
SENTRY_AUTH_TOKEN
SENTRY_ORG
SENTRY_PROJECT
```

---

## 4. Cloudinary Documents Backup

Uploaded documents (PDFs, images) are stored in **Cloudinary**. They are NOT included in the MongoDB backup.

**To back up Cloudinary assets:**
1. Use Cloudinary's [Backup to S3/GCS](https://cloudinary.com/documentation/migration#backup_options) feature (paid plans)
2. Or use the Cloudinary Admin API to list and download assets:
   ```bash
   curl -X GET "https://api.cloudinary.com/v1_1/<CLOUD_NAME>/resources/image?max_results=500" \
     -u "<API_KEY>:<API_SECRET>"
   ```

---

## 5. Disaster Recovery Checklist

If the database is lost or corrupted:

- [ ] Stop all deployments (Vercel → Deployments → pause)
- [ ] Restore from the latest backup: `bash scripts/restore.sh <latest.tar.gz>`
- [ ] Verify record counts in MongoDB Atlas Data Explorer
- [ ] Re-enable deployments
- [ ] Notify school admin of any data gap between last backup and incident time

**RTO (Recovery Time Objective):** < 2 hours with a valid backup  
**RPO (Recovery Point Objective):** < 24 hours (daily backup schedule)

---

## 6. Testing Backups

Run a monthly backup test on a staging database:

```bash
# 1. Take a backup from production
MONGODB_URI="$PROD_URI" bash scripts/backup.sh

# 2. Restore to a staging database
MONGODB_URI="$STAGING_URI" bash scripts/restore.sh backups/ctk_enrollsys_<latest>.tar.gz

# 3. Spot-check record counts
mongosh "$STAGING_URI" --eval "db.enrollments.countDocuments({})"
```
