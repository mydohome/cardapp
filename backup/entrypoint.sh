#!/bin/bash
set -euo pipefail

# La crontab statica non puo' leggere variabili d'ambiente: la generiamo qui,
# ad ogni avvio del container, cosi' BACKUP_SCHEDULE_CRON da .env e' davvero
# configurabile (prima veniva letta da .env/install.sh ma il container usava
# comunque l'orario fisso copiato nell'immagine, ignorandola).
SCHEDULE="${BACKUP_SCHEDULE_CRON:-0 3 * * 0}"
echo "${SCHEDULE} /usr/local/bin/backup.sh >> /proc/1/fd/1 2>&1" > /etc/crontabs/root

echo "[backup] Schedulazione cron: ${SCHEDULE}"
exec crond -f -l 2
