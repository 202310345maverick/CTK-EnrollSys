#!/bin/bash
# CTK EnrollSys — MongoDB Restore Script
# Usage: MONGODB_URI="<uri>" bash scripts/restore.sh <backup_file.tar.gz>

set -euo pipefail

if [ -z "${MONGODB_URI:-}" ]; then
  echo "ERROR: MONGODB_URI environment variable is required"
  exit 1
fi

if [ -z "${1:-}" ]; then
  echo "Usage: bash scripts/restore.sh <backup_file.tar.gz>"
  exit 1
fi

BACKUP_FILE="$1"
TEMP_DIR=$(mktemp -d)

echo "Extracting backup: ${BACKUP_FILE}"
tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"

BACKUP_FOLDER=$(ls "${TEMP_DIR}")
echo "Restoring from: ${BACKUP_FOLDER}"
mongorestore --uri="${MONGODB_URI}" --dir="${TEMP_DIR}/${BACKUP_FOLDER}" --drop

rm -rf "${TEMP_DIR}"
echo "Restore complete."
