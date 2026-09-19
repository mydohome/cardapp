#!/bin/bash
# Aggiorna CardApp dal repository e riavvia lo stack in modo sicuro:
# - si ferma se ci sono modifiche locali non committate (mai sovrascritte)
# - aggiorna solo in fast-forward: non fa mai un merge automatico
# - fa un backup di sicurezza prima di toccare qualunque cosa (se il
#   servizio "backup" e' in esecuzione)
# - ricostruisce/riavvia solo l'installazione effettivamente configurata
#   (sviluppo o produzione, rilevata da dove trova il .env)
#
# Uso: ./update.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

echo "=== CardApp - aggiornamento ==="
echo

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[ERRORE] $REPO_ROOT non e' un repository git."
  exit 1
fi

# --- 1. rifiuta di procedere se ci sono modifiche locali non committate ---
if [ -n "$(git status --porcelain)" ]; then
  echo "[ERRORE] Ci sono modifiche locali non committate:"
  git status --short
  echo
  echo "Mettile a posto (commit, stash o scarta) prima di aggiornare: il pull"
  echo "in fast-forward si rifiuta di procedere per non rischiare di perderle"
  echo "o di creare un merge inatteso su un server di produzione."
  exit 1
fi

# --- 2. individua quale installazione e' configurata (dev o produzione) ---
HAS_DEV=0
HAS_PROD=0
[ -f "$REPO_ROOT/.env" ] && HAS_DEV=1
[ -f "$REPO_ROOT/deploy/.env" ] && HAS_PROD=1

if [ "$HAS_DEV" = 1 ] && [ "$HAS_PROD" = 1 ]; then
  echo "Trovate entrambe le installazioni configurate."
  echo "  1) Sviluppo (root)"
  echo "  2) Produzione (deploy/)"
  read -rp "Quale aggiornare? [1/2]: " CHOICE
  if [ "$CHOICE" = "2" ]; then
    COMPOSE_DIR="$REPO_ROOT/deploy"
    BACKEND_SERVICE="app"
  else
    COMPOSE_DIR="$REPO_ROOT"
    BACKEND_SERVICE="backend"
  fi
elif [ "$HAS_PROD" = 1 ]; then
  COMPOSE_DIR="$REPO_ROOT/deploy"
  BACKEND_SERVICE="app"
elif [ "$HAS_DEV" = 1 ]; then
  COMPOSE_DIR="$REPO_ROOT"
  BACKEND_SERVICE="backend"
else
  echo "[ERRORE] Nessuna installazione trovata (manca .env sia in root che in deploy/)."
  echo "Esegui prima ./install.sh"
  exit 1
fi

echo "Installazione da aggiornare: $COMPOSE_DIR"
echo

# --- 3. verifica se ci sono davvero novita' da scaricare ---
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "Branch corrente: $CURRENT_BRANCH"
git fetch origin "$CURRENT_BRANCH"

LOCAL_SHA="$(git rev-parse HEAD)"
REMOTE_SHA="$(git rev-parse "origin/$CURRENT_BRANCH")"

if [ "$LOCAL_SHA" = "$REMOTE_SHA" ]; then
  echo "Gia' aggiornato: nessuna modifica da scaricare."
  exit 0
fi
echo "Nuove modifiche disponibili su origin/$CURRENT_BRANCH ($LOCAL_SHA -> $REMOTE_SHA)."

# --- 4. backup di sicurezza prima di aggiornare, se lo stack e' attivo ---
echo
if (cd "$COMPOSE_DIR" && docker compose ps --status running --services 2>/dev/null | grep -qx backup); then
  echo "Eseguo un backup di sicurezza prima di aggiornare..."
  (cd "$COMPOSE_DIR" && docker compose exec -T backup /usr/local/bin/backup.sh)
else
  echo "[AVVISO] il servizio 'backup' non risulta in esecuzione: procedo senza backup di sicurezza."
fi

# --- 5. aggiorna il codice: SOLO fast-forward, mai un merge automatico ---
echo
echo "Aggiorno il codice (fast-forward only)..."
git merge --ff-only "origin/$CURRENT_BRANCH"

# --- 6. ricostruisci e riavvia i servizi ---
echo
echo "Ricostruisco e riavvio i servizi..."
(cd "$COMPOSE_DIR" && docker compose up -d --build)

# --- 7. ri-applica il seed del catalogo negozi (idempotente: non duplica nulla) ---
echo
echo "Aggiorno il catalogo negozi di base..."
if ! (cd "$COMPOSE_DIR" && docker compose exec -T "$BACKEND_SERVICE" python -m app.seed_stores); then
  echo "[AVVISO] seed negozi non eseguito (il backend potrebbe non essere ancora pronto): riprova a mano tra poco."
fi

echo
echo "Stato dei servizi:"
(cd "$COMPOSE_DIR" && docker compose ps)

echo
echo "Aggiornamento completato: $LOCAL_SHA -> $REMOTE_SHA"
