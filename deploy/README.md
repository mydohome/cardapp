# Deploy di produzione dietro Nginx Proxy Manager

Questo compose è pensato per un host dove gira già uno stack **Nginx Proxy
Manager (NPM)** che gestisce TLS/certificati e fa da reverse proxy verso i
container delle varie app, tutte collegate a una rete Docker esterna comune.

## 1. Rete condivisa con NPM

Se non esiste già:

```bash
docker network create proxy-net
```

Lo stack di NPM deve essere collegato anche lui a `proxy-net` (aggiungi la
rete al suo compose se non c'è già).

## 2. Immagini

Questo compose usa `build:` per `web` e `app`: vengono buildate direttamente
sull'host di produzione da questo stesso repository, la prima volta che lanci
`docker compose up --build` (nessun passaggio manuale prima).

Se invece preferisci pubblicarle su una registry (es. per un flusso CI/CD che
builda una volta sola e distribuisce l'immagine già pronta a più host),
sostituisci nel compose:

```yaml
web:
  image: ghcr.io/<tua-org>/cardapp-frontend:latest
app:
  image: ghcr.io/<tua-org>/cardapp-backend:latest
```

e prima del deploy:

```bash
docker build -t ghcr.io/<tua-org>/cardapp-frontend:latest ../frontend
docker build -t ghcr.io/<tua-org>/cardapp-backend:latest ../backend
docker push ghcr.io/<tua-org>/cardapp-frontend:latest
docker push ghcr.io/<tua-org>/cardapp-backend:latest
```

## 3. Configurazione

Dalla radice del repo:

```bash
./install.sh
```

Scegli l'opzione "2) Produzione dietro Nginx Proxy Manager": genera `deploy/.env` con
password/segreti sicuri creati automaticamente, crea `db/data`, `redis/data`,
`uploads/data`, `backups`, e offre di creare la rete `proxy-net` se manca.

In alternativa, a mano:

```bash
cp .env.example .env
# valorizza .env con segreti reali (password DB, JWT_SECRET, ecc.)

mkdir -p db/data redis/data uploads/data backups
```

## 4. Avvio

```bash
docker compose up -d --build
docker compose exec app python -m app.seed_stores   # popola il catalogo negozi
```

Per creare/gestire utenti, dalla radice del repo: `./manage-users.sh` (rileva da solo
che questa è l'installazione di produzione).

## 5. Proxy Host in NPM

Nella UI di NPM crea un unico Proxy Host:
- **Domain**: es. `cardapp.tuodominio.it`
- **Forward Hostname/IP**: `cardapp-web` (nome del container, risolvibile via
  DNS interno di Docker perché sulla stessa rete `proxy-net`)
- **Forward Port**: `80`
- Abilita **SSL** con certificato Let's Encrypt e **Force SSL**

Il container `cardapp-web` è l'unico punto di ingresso pubblico: instrada
internamente le chiamate `/api/*` verso `cardapp-app` sulla rete Docker
interna `backend` (vedi `frontend/nginx.conf.template`), così l'app resta
same-origin e non serve esporre il backend separatamente su NPM.

## Note sulla sicurezza di rete

- `backend` è una rete `internal: true`: i container `app`, `db`, `redis`,
  `backup` non hanno accesso a Internet né sono raggiungibili
  dall'esterno, solo tra loro.
- Solo `web` è collegato sia a `proxy-net` che a `backend`, facendo da unico
  varco tra l'esterno e lo stack interno.
- `cap_drop: ALL` è applicato a `web`, `app` e `backup` (servizi stateless
  che non necessitano di capability Linux particolari). Non è applicato a
  `db`/`redis` perché le rispettive immagini ufficiali possono avere
  bisogno di operazioni privilegiate alla prima inizializzazione del volume
  dati (es. `chown`).

## Storage foto carte

Le foto caricate durante lo scan sono salvate su disco dal container `app`
in `./uploads/data` (bind mount, non un object storage): per un uso
self-hosted personale/familiare non serve la semantica S3, ed è un servizio
in meno da mantenere.

## Backup

Il container `backup` esegue ogni notte (cron) un `pg_dump` + archivio delle
foto carte in `./backups/<timestamp>/`, con rotazione automatica (`BACKUP_KEEP_LAST`
in `.env`). Ripristino manuale:

```bash
docker compose exec backup /usr/local/bin/restore.sh <timestamp_backup>
```
