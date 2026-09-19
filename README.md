# CardApp

PWA per la gestione delle carte fedeltà: scansione barcode da fotocamera iPhone,
riconoscimento automatico negozio/logo da foto, condivisione carte tra utenti,
gestione via web, backup e ripristino locali.

Stack: FastAPI (backend) + React/Vite PWA (frontend) + PostgreSQL + Redis,
foto delle carte salvate su disco locale, il tutto orchestrato con Docker
Compose dietro un reverse proxy Caddy.

Dettaglio delle funzionalità (implementate e pianificate): [docs/FUNCTIONALITY.md](docs/FUNCTIONALITY.md).

## Avvio rapido

```bash
./install.sh
```

Chiede se preparare l'installazione di sviluppo (root, questa sezione) o quella di
produzione dietro Nginx Proxy Manager ([deploy/](deploy/README.md)), genera un `.env`
con password/segreti sicuri creati automaticamente (non serve inventarli né ricordarli),
prepara le directory necessarie e verifica che tutto sia a posto. Alla fine stampa il
comando da lanciare, tipicamente:

```bash
docker compose up -d --build
```

In alternativa, per farlo a mano: `cp .env.example .env`, valorizza i segreti a mano,
poi `docker compose up --build`.

Servizi esposti:
- `http://localhost` → app (frontend + `/api/*` verso il backend, tramite Caddy)

Popola il catalogo negozi di base (nomi principali catene IT, usato per l'associazione
automatica del logo):

```bash
docker compose exec backend python -m app.seed_stores
```

## Gestione utenti

```bash
./manage-users.sh
```

Apre una CLI a menu (elenca, crea, cambia password, elimina) che gira dentro il
container backend già avviato — rileva da solo se stai usando l'installazione di
sviluppo o quella di produzione. Ogni utente ha un **username** semplice (3-32
caratteri) come identificativo principale: l'email è facoltativa. Il login accetta
sia l'username sia l'email, se impostata. L'username è anche ciò che si usa per
condividere una carta con qualcuno. In alternativa, direttamente:

```bash
docker compose exec backend python -m app.manage_users
```

## Aggiornamento

```bash
./update.sh
```

Aggiorna il codice e riavvia lo stack in modo sicuro: si rifiuta di procedere se ci
sono modifiche locali non committate, scarica solo in fast-forward (mai un merge
automatico), fa un backup di sicurezza prima di toccare qualunque cosa (se il
servizio `backup` è attivo), poi ricostruisce e riavvia solo l'installazione che
trova configurata. Non fa nulla se sei già aggiornato.

In alternativa, a mano:

```bash
git pull
docker compose up -d --build   # dalla cartella giusta: root oppure deploy/
```

## Testare lo scan da iPhone reale

iOS Safari richiede un **contesto sicuro (HTTPS)** per l'accesso alla fotocamera,
tranne che su `localhost`. Per testare da un iPhone in rete locale:
- usa un dominio reale con Caddy in modalità `auto_https` (rimuovi `auto_https off`
  dal `Caddyfile` e imposta il tuo dominio al posto di `:80`), oppure
- usa un tunnel HTTPS temporaneo (es. Tailscale Funnel, ngrok) verso la porta 80.

## Uso offline (es. al supermercato senza campo)

Le carte già sincronizzate sono utilizzabili anche a connessione assente: ricerca,
apertura e barcode fullscreen funzionano da una cache locale sul dispositivo, senza
contattare il backend. Aggiungere una carta nuova, invece, richiede connessione.

Come verificarlo:
1. Apri l'app **almeno una volta online** (da installata, "Aggiungi a Home" su iOS) —
   questo scarica e salva le carte in locale.
2. Metti il dispositivo in modalità aereo.
3. Riapri l'app: deve caricarsi normalmente e mostrare un banner "Sei offline";
   ricerca e apertura fullscreen delle carte devono continuare a funzionare.

Se dopo il primo avvio online una carta non compare offline, riapri l'app online
un'altra volta: la sincronizzazione avviene ad ogni apertura riuscita, non in automatico
in background.

## Backup e ripristino

- Backup automatico ogni notte (cron nel container `backup`), salvato in `./backups/<timestamp>/`.
- Rotazione: mantiene gli ultimi `BACKUP_KEEP_LAST` backup (default 7, in `.env`).
- Backup manuale immediato:
  ```bash
  docker compose exec backup /usr/local/bin/backup.sh
  ```
- Ripristino da un backup specifico:
  ```bash
  docker compose exec backup /usr/local/bin/restore.sh <timestamp_backup>
  ```

## Deploy di produzione (dietro Nginx Proxy Manager)

Il `docker-compose.yml` alla radice è pensato per sviluppo/uso locale (con Caddy
incluso). Per un deploy su un host dove gira già **Nginx Proxy Manager**, che
gestisce TLS e reverse proxy su una rete Docker condivisa, usa invece
[deploy/docker-compose.yml](deploy/docker-compose.yml) — istruzioni complete in
[deploy/README.md](deploy/README.md).

## Struttura repo

```
backend/          API FastAPI (auth, carte, negozi, condivisioni, OCR/riconoscimento)
frontend/         PWA React/Vite (ricerca istantanea, scan, barcode fullscreen)
backup/           Script e container di backup/restore schedulati
deploy/           Compose di produzione dietro Nginx Proxy Manager
docs/             Specifica funzionale dettagliata
Caddyfile         Reverse proxy + terminazione HTTPS (solo per lo stack di sviluppo)
install.sh        Installazione guidata (sceglie dev/prod, genera .env con segreti)
update.sh         Aggiornamento sicuro da git (fast-forward + backup + rebuild)
manage-users.sh   Apre la CLI di gestione utenti nel container backend
```

## Stato del progetto

Questo è lo scaffold iniziale: autenticazione, CRUD carte, scan/riconoscimento foto,
condivisione, ricerca istantanea e backup sono implementati a livello di base (MVP).
Vedi [docs/FUNCTIONALITY.md](docs/FUNCTIONALITY.md) per cosa manca ancora (gruppi
famiglia, pannello admin negozi, match visivo dei loghi, ecc.).
