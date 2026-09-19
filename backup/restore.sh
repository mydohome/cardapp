#!/bin/bash
# Ripristina un backup specifico. Uso:
#   docker compose exec backup /usr/local/bin/restore.sh 20250101_030000
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Uso: restore.sh <timestamp_backup>"
  echo "Backup disponibili:"
  ls -1 /backups
  exit 1
fi

SRC="/backups/$1"
if [ ! -d "${SRC}" ]; then
  echo "Backup '$1' non trovato in /backups"
  exit 1
fi

echo "[restore] ATTENZIONE: questa operazione sovrascrive il database e i file attuali."
read -p "Continuare? (scrivi 'si' per confermare) " CONFIRM
if [ "${CONFIRM}" != "si" ]; then
  echo "Annullato."
  exit 0
fi

echo "[restore] Ripristino PostgreSQL da ${SRC}/postgres.dump..."
PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore \
  -h postgres -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
  --clean --if-exists "${SRC}/postgres.dump"

echo "[restore] Ripristino dati MinIO da ${SRC}/minio_data.tar.gz..."
rm -rf /minio_data/*
tar -xzf "${SRC}/minio_data.tar.gz" -C /minio_data

echo "[restore] Completato. Riavvia i servizi backend/minio per applicare i dati."
