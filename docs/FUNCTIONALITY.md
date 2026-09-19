# Specifica funzionale

Stato: v1 (scaffold). Sezioni marcate **[MVP]** sono implementate nello scaffold iniziale;
le altre sono previste ma non ancora sviluppate.

## 1. Autenticazione
- **[MVP]** Registrazione email+password, login con JWT.
- Reset password via email.
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
- **[MVP]** Condivisione diretta a utente registrato (by email).
- **[MVP]** Link di invito con token e scadenza, per chi non è ancora registrato.
- Gruppi "famiglia": carte condivise automaticamente con tutti i membri del gruppo.

## 6. Gestione via web
- **[MVP]** Stessa PWA responsive, utilizzabile da browser desktop.
- Pannello amministrativo per il catalogo negozi/loghi (merge duplicati, upload logo manuale).

## 7. Backup e ripristino (locale)
- **[MVP]** Container `backup` schedulato (cron) → `pg_dump` + tar dei dati MinIO su `./backups`.
- **[MVP]** Rotazione automatica (mantiene ultimi N backup, configurabile via `BACKUP_KEEP_LAST`).
- **[MVP]** Script `restore.sh` per ripristino manuale da un backup specifico.
- Export utente singolo (zip con metadati + immagini), scaricabile dall'app.

## 8. PWA / offline
- **[MVP]** Manifest + service worker (installabile su iPhone da Safari, "Aggiungi a Home").
- **[MVP]** Cache locale delle carte (localStorage) per consultazione/barcode fullscreen offline.
- Sync in background alla riconnessione per modifiche fatte offline.

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
