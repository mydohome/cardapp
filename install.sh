#!/bin/bash
# Installazione guidata di CardApp: sceglie tra stack di sviluppo (root,
# con Caddy incluso) e stack di produzione dietro Nginx Proxy Manager
# (deploy/), genera un .env con password/segreti sicuri generati
# automaticamente e prepara le directory necessarie.
#
# Uso: ./install.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

gen_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 24
  else
    head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'
  fi
}

echo "=== CardApp - installazione guidata ==="
echo
echo "Che tipo di installazione vuoi preparare?"
echo "  1) Sviluppo / uso locale (include Caddy come reverse proxy)"
echo "  2) Produzione dietro Nginx Proxy Manager (NPM) gia' installato"
echo
read -rp "Scelta [1/2]: " MODE

case "$MODE" in
  1)
    TARGET_DIR="$REPO_ROOT"
    DB_HOST="postgres"
    BACKEND_SERVICE="backend"
    ;;
  2)
    TARGET_DIR="$REPO_ROOT/deploy"
    DB_HOST="db"
    BACKEND_SERVICE="app"
    ;;
  *)
    echo "Scelta non valida, uscita."
    exit 1
    ;;
esac

ENV_FILE="$TARGET_DIR/.env"

echo
if [ -f "$ENV_FILE" ]; then
  echo "Trovato un .env esistente in: $ENV_FILE"
  read -rp "Sovrascriverlo generando nuovi segreti? Le password attuali smetteranno di funzionare (si/No): " OVERWRITE
  if [ "${OVERWRITE,,}" != "si" ]; then
    echo "Mantengo il .env esistente, nessuna modifica ai segreti."
    SKIP_ENV=1
  fi
fi

if [ -z "${SKIP_ENV:-}" ]; then
  POSTGRES_USER="cardapp"
  POSTGRES_DB="cardapp"
  POSTGRES_PASSWORD="$(gen_secret)"
  JWT_SECRET="$(gen_secret)$(gen_secret)"

  cat > "$ENV_FILE" <<EOF
# Generato da install.sh il $(date +%F) — non serve ricordare questi valori,
# restano solo qui. Non versionare questo file e non condividerlo.

POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}
DATABASE_URL=postgresql+psycopg2://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DB_HOST}:5432/${POSTGRES_DB}
DB_HOST=${DB_HOST}

REDIS_URL=redis://redis:6379/0

JWT_SECRET=${JWT_SECRET}
JWT_ALGORITHM=HS256
# Scadenza lunga di proposito: l'uso offline delle carte gia' sincronizzate
# non deve richiedere un nuovo login ogni poche decine di minuti.
ACCESS_TOKEN_EXPIRE_MINUTES=20160
REFRESH_TOKEN_EXPIRE_DAYS=30

BACKUP_KEEP_LAST=14
BACKUP_SCHEDULE_CRON=0 3 * * 0

LOGO_UPDATE_INTERVAL_HOURS=168
EOF
  chmod 600 "$ENV_FILE"
  echo "Creato $ENV_FILE con password e segreti generati automaticamente (permessi 600)."
fi

echo
echo "Preparo le directory necessarie..."
mkdir -p "$TARGET_DIR/backups"
if [ "$MODE" = "2" ]; then
  mkdir -p "$TARGET_DIR/db/data" "$TARGET_DIR/redis/data"

  if command -v docker >/dev/null 2>&1; then
    if ! docker network inspect proxy-net >/dev/null 2>&1; then
      echo
      echo "La rete Docker 'proxy-net' (condivisa con Nginx Proxy Manager) non esiste."
      read -rp "Crearla ora? (si/No): " CREATE_NET
      if [ "${CREATE_NET,,}" = "si" ]; then
        docker network create proxy-net
      else
        echo "Ricorda di crearla prima di avviare i servizi: docker network create proxy-net"
      fi
    fi
  fi
fi

echo
echo "=== Verifica finale ==="
CHECKS_OK=1

if ! command -v docker >/dev/null 2>&1; then
  echo "[ERRORE] docker non trovato nel PATH."
  CHECKS_OK=0
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "[ERRORE] plugin 'docker compose' (v2) non trovato."
  CHECKS_OK=0
fi

if grep -q "change_me" "$ENV_FILE" 2>/dev/null; then
  echo "[ERRORE] in $ENV_FILE sono rimasti valori placeholder non sostituiti."
  CHECKS_OK=0
fi

if [ "$MODE" = "2" ] && command -v docker >/dev/null 2>&1; then
  if ! docker network inspect proxy-net >/dev/null 2>&1; then
    echo "[AVVISO] la rete 'proxy-net' non esiste ancora: crearla prima di 'docker compose up'."
  fi
fi

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  if ! (cd "$TARGET_DIR" && docker compose config >/dev/null); then
    echo "[ERRORE] 'docker compose config' fallisce: controlla $TARGET_DIR/docker-compose.yml e $ENV_FILE."
    CHECKS_OK=0
  fi
fi

echo
if [ "$CHECKS_OK" = "1" ]; then
  echo "Tutto pronto."
else
  echo "Alcuni controlli sono falliti: risolvi i punti sopra prima di avviare i servizi."
fi

echo
echo "Per avviare lo stack:"
echo "  cd $TARGET_DIR"
echo "  docker compose up -d --build"
echo
echo "Dopo il primo avvio, popola il catalogo negozi di base:"
echo "  cd $TARGET_DIR && docker compose exec ${BACKEND_SERVICE} python -m app.seed_stores"

if [ "$MODE" = "2" ]; then
  echo
  echo "In Nginx Proxy Manager crea un Proxy Host verso 'cardapp-web:80' (vedi deploy/README.md)."
fi
