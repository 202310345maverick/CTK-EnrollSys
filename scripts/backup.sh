#!/bin/bash
# CTK EnrollSys — MongoDB Backup Script
# Usage: MONGODB_URI="<uri>" bash scripts/backup.sh
# Or set MONGODB_URI in a .env file and source it first

set -euo pipefail

BACKUP_DIR="$(dirname "$0")/../backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="ctk_enrollsys_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

mkdir -p "$BACKUP_DIR"

if [ -z "${MONGODB_URI:-}" ]; then
  echo "ERROR: MONGODB_URI environment variable is required"
  exit 1
fi

echo "Starting backup: ${BACKUP_NAME}"
mongodump --uri="${MONGODB_URI}" --out="${BACKUP_PATH}"

echo "Compressing backup..."
tar -czf "${BACKUP_PATH}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"
rm -rf "${BACKUP_PATH}"

# Delete backups older than 30 days
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "Backup complete: ${BACKUP_PATH}.tar.gz"
