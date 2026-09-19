#!/bin/bash
# Apre la CLI a menu per creare/gestire utenti CardApp, eseguendola dentro
# il container backend gia' in esecuzione (dev o produzione, a seconda di
# quale .env trova).
#
# Uso: ./manage-users.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

HAS_DEV=0
HAS_PROD=0
[ -f "$REPO_ROOT/.env" ] && HAS_DEV=1
[ -f "$REPO_ROOT/deploy/.env" ] && HAS_PROD=1

if [ "$HAS_DEV" = 1 ] && [ "$HAS_PROD" = 1 ]; then
  echo "Trovate entrambe le installazioni configurate."
  echo "  1) Sviluppo (root)"
  echo "  2) Produzione (deploy/)"
  read -rp "Quale gestire? [1/2]: " CHOICE
  if [ "$CHOICE" = "2" ]; then
    COMPOSE_DIR="$REPO_ROOT/deploy"
    SERVICE="app"
  else
    COMPOSE_DIR="$REPO_ROOT"
    SERVICE="backend"
  fi
elif [ "$HAS_PROD" = 1 ]; then
  COMPOSE_DIR="$REPO_ROOT/deploy"
  SERVICE="app"
elif [ "$HAS_DEV" = 1 ]; then
  COMPOSE_DIR="$REPO_ROOT"
  SERVICE="backend"
else
  echo "Nessuna installazione trovata (manca .env sia in root che in deploy/)."
  echo "Esegui prima ./install.sh"
  exit 1
fi

cd "$COMPOSE_DIR"

if ! docker compose ps --status running --services 2>/dev/null | grep -qx "$SERVICE"; then
  echo "Il servizio '$SERVICE' non risulta in esecuzione in $COMPOSE_DIR."
  echo "Avvialo con: (cd $COMPOSE_DIR && docker compose up -d)"
  exit 1
fi

docker compose exec "$SERVICE" python -m app.manage_users
