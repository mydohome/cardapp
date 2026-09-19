# Specifica funzionale

Stato: v1 (scaffold). Sezioni marcate **[MVP]** sono implementate nello scaffold iniziale;
le altre sono previste ma non ancora sviluppate.

## 1. Autenticazione
- **[MVP]** Username semplice (3-32 caratteri) + password come credenziali principali;
  l'email è facoltativa. Login accetta indifferentemente username o email.
- **[MVP]** Utenti creati dall'amministratore via CLI (`./manage-users.sh`), non c'è
  auto-registrazione dall'app: adatto a un uso familiare/multiutente su un'istanza propria.
- Reset password via email (richiede che l'utente abbia un'email impostata).
- Sign in with Apple / Google (consigliato per utenza iPhone).

## 2. Acquisizione carta
- **[MVP]** Scan barcode live da fotocamera (`@zxing/browser`).
- **[MVP]** Fallback: upload foto → decodifica barcode server-side (`pyzbar`).
- **[MVP]** Inserimento manuale (codice + simbologia).

## 3. Riconoscimento negozio/logo
- **[MVP]** OCR sulla foto (`pytesseract`) + fuzzy match testuale contro il catalogo `stores`.
- Catalogo negozi pre-popolato (script `backend/app/seed_stores.py`, da estendere).
- v2: embedding visivo del logo (CLIP) per match anche senza testo leggibile.
- Ricerca/assegnazione manuale del negozio quando il match automatico fallisce.

## 4. Ricerca e visualizzazione
- **[MVP]** Ricerca istantanea client-side (Fuse.js) su tutte le carte caricate in cache locale.
- **[MVP]** Vista fullscreen del barcode con Screen Wake Lock (evita spegnimento schermo alla cassa).
- **[MVP]** Sezione "Recenti" per accesso rapido alle carte usate più spesso.
- Ordinamento per categoria, tag personalizzati, preferiti.

## 5. Multiutente e condivisione
- **[MVP]** Modello dati: `Card` (owner) + `CardShare` (utente destinatario, permesso view/edit).
- **[MVP]** Interfaccia di condivisione: pulsante "condividi" (⇪) su ogni carta posseduta,
  apre un modal per condividere per username con permesso sola-lettura/modifica, vedere
  con chi è già condivisa e rimuovere una condivisione.
- **[MVP]** Link di invito con token e scadenza (72h di default), generabile dallo stesso
  modal, per chi non ha ancora ricevuto una condivisione diretta ma ha già un account.
  Accettarlo (pagina `/invite/:token`) richiede login: se non sei autenticato, l'app ti
  manda al login e riprende automaticamente l'accettazione subito dopo.
- Gruppi "famiglia": carte condivise automaticamente con tutti i membri del gruppo.
- Invito via link utilizzabile anche da chi non ha ancora un account (oggi serve che
  l'amministratore crei prima l'utente via CLI).

## 6. Gestione via web
- **[MVP]** Stessa PWA responsive, utilizzabile da browser desktop.
- Pannello amministrativo per il catalogo negozi/loghi (merge duplicati, upload logo manuale).

## 7. Backup e ripristino (locale)
- **[MVP]** Container `backup` schedulato (cron) → `pg_dump` + tar delle foto carte su `./backups`.
- **[MVP]** Rotazione automatica (mantiene ultimi N backup, configurabile via `BACKUP_KEEP_LAST`).
- **[MVP]** Script `restore.sh` per ripristino manuale da un backup specifico.
- Export utente singolo (zip con metadati + immagini), scaricabile dall'app.

## 8. PWA / offline

Requisito fondamentale: le carte gia' sincronizzate devono restare **completamente
utilizzabili senza connessione** (es. al supermercato senza campo).

- **[MVP]** Manifest + service worker (installabile su iPhone da Safari, "Aggiungi a Home").
- **[MVP]** Precache dell'intera app shell (JS/CSS/HTML): l'app si apre e naviga tra le
  pagine anche a connessione completamente assente, non solo con dati gia' caricati.
- **[MVP]** Cache locale delle carte (localStorage) aggiornata a ogni apertura online
  dell'app: lista, ricerca istantanea (Fuse.js) e barcode fullscreen (bwip-js, generato
  client-side) funzionano tutti da questa cache, senza bisogno del backend.
- **[MVP]** Cache runtime (CacheFirst) delle immagini dei loghi negozio, cosi' restano
  visibili anche offline dopo il primo caricamento.
- **[MVP]** Fallback visivo (iniziale del nome) se un logo non e' disponibile offline,
  invece di un'icona rotta.
- **[MVP]** Banner "sei offline" quando manca connessione, per rassicurare l'utente che
  sta correttamente vedendo dati salvati e non un errore.
- **[MVP]** Sessione (JWT) di lunga durata (14 giorni di default): la verifica di
  autenticazione lato client controlla solo la presenza del token, non lo valida contro
  il server, quindi l'accesso alle carte in cache non richiede mai rete.
- Sync in background alla riconnessione per modifiche fatte offline (oggi solo in lettura:
  aggiungere/modificare una carta richiede comunque connessione, la consultazione no).
- v2: refresh-token flow per non dover comunque rifare login dopo settimane di inattivita'.

**Limite noto**: la primissima sincronizzazione richiede una connessione (per scaricare
le carte e per l'installazione iniziale della PWA). Da li' in poi, tutto cio' che serve
per usare le carte gia' presenti funziona offline.

## 9. Sicurezza
- Rate limiting su login e su endpoint di condivisione.
- Cifratura a riposo del numero carta (v2).
- Log di audit su condivisioni/accessi a carte condivise.

## Note tecniche importanti

- **HTTPS obbligatorio per la fotocamera su iOS Safari**, tranne che su `localhost`.
  Per testare su iPhone reale servono HTTPS validi (dominio + Caddy con `auto_https` attivo)
  oppure un tunnel (es. Tailscale Funnel, ngrok) durante lo sviluppo.
- Il riconoscimento OCR/logo è pensato per migliorare nel tempo aggiungendo negozi al catalogo;
  non serve un dataset enorme fin da subito, basta coprire le catene più comuni.
