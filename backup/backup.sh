#!/bin/bash
set -euo pipefail

BACKUP_ROOT="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEST="${BACKUP_ROOT}/${TIMESTAMP}"
KEEP_LAST="${BACKUP_KEEP_LAST:-7}"
DB_HOST="${DB_HOST:-postgres}"

mkdir -p "${DEST}"

echo "[backup] Dump PostgreSQL..."
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${DB_HOST}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
  -F c -f "${DEST}/postgres.dump"

echo "[backup] Archivio foto carte..."
tar -czf "${DEST}/uploads.tar.gz" -C /uploads_data .

echo "[backup] Completato: ${DEST}"

echo "[backup] Rotazione: mantengo gli ultimi ${KEEP_LAST} backup..."
cd "${BACKUP_ROOT}"
ls -1t | tail -n +$((KEEP_LAST + 1)) | xargs -r rm -rf --

echo "[backup] Fatto."
