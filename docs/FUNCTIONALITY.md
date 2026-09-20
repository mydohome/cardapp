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
- **[MVP]** Fallback: upload foto → decodifica barcode server-side (`pyzbar`). La foto è
  usata solo al volo per leggere il codice, non viene salvata: una volta letto il
  numero, il barcode viene sempre rigenerato identico (bwip-js, con il numero
  stampato sotto), quindi non serve conservare l'immagine originale.
- **[MVP]** Inserimento manuale (codice + simbologia), per quando né lo scan live né la
  foto riescono a leggere il barcode (es. carta danneggiata/consumata, simbologia rara):
  pulsante "Inserisci il codice a mano" nella schermata di scansione, che ferma la
  fotocamera (altrimenti potrebbe sovrascrivere il campo mentre si scrive) e apre lo
  stesso modulo di modifica carta, vuoto e compilabile a mano.

## 3. Riconoscimento negozio/logo
- **[MVP]** OCR sulla foto (`pytesseract`, anche qui la foto non viene salvata) + fuzzy
  match testuale contro il catalogo `stores`.
- **[MVP]** Catalogo negozi pre-popolato (script `backend/app/seed_stores.py`, ~35 catene
  italiane: supermercati, elettronica, bricolage, profumerie, farmacie, librerie, cinema,
  carburante) con logo incluso: la favicon del sito ufficiale del negozio, presa dal
  percorso classico o tramite il servizio favicon di Google per i siti che la bloccano
  (non ospitiamo noi le immagini, solo un link; [Clearbit Logo API](https://clearbit.com/logo),
  usata in precedenza, è stata ritirata senza preavviso). Rieseguire lo script dopo un
  aggiornamento aggiunge/corregge il logo dei negozi che non ne hanno ancora uno verificato,
  senza toccare eventuali `logo_url` personalizzati a mano. Se un logo non compare per un
  negozio, va verificato con `curl` dal server e corretto nello script.
- v2: embedding visivo del logo (CLIP) per match anche senza testo leggibile.
- **[MVP]** Assegnazione/cambio manuale del negozio con autocomplete e anteprima del logo
  (`StoreAutocomplete`, componente condiviso), sia in creazione (scansione/inserimento
  manuale) sia in modifica carta: mentre si scrive il nome, l'app suggerisce un negozio
  già noto in catalogo (con il suo logo) invece di aspettare solo il match OCR.
- **[MVP]** Ricerca/aggiornamento automatico dei negozi in base alle carte davvero
  aggiunte (`backend/app/update_store_logos.py`), non solo il catalogo statico di
  seed_stores.py: per ogni carta senza negozio, prova prima il fuzzy match contro il
  catalogo esistente, poi - se non trova nulla - indovina un dominio dal nome della
  carta (ripulito da parole come "fidaty/card/club/...") e lo verifica con una
  richiesta di rete reale prima di creare un nuovo negozio col logo scoperto (mai
  a scatola chiusa). Schedulato automaticamente una volta a settimana
  (`app/logo_update_scheduler.py`, servizio `logo-updater` in docker-compose,
  intervallo configurabile via `LOGO_UPDATE_INTERVAL_HOURS`); eseguibile anche a mano
  con `docker compose exec app python -m app.update_store_logos`.

## 4. Ricerca e visualizzazione
- **[MVP]** Navigazione a tab bar in basso (Scan, Ricerca, Preferiti, Impostazioni), in
  stile "liquid glass" (pillola flottante traslucida con `backdrop-filter`, icone SVG
  lineari dedicate per funzione, non emoji), con banner brandizzato in alto (logo +
  wordmark "CardApp" + tagline, dalla grafica fornita). Banner e tab attiva usano
  **lo stesso gradiente pieno** (`#2563eb` → `#0764f6`, non velato di trasparenza sulla
  tab per non farlo sembrare un blu diverso una volta mescolato con lo sfondo scuro
  della pillola). "Ricerca" è la schermata iniziale: banner → campo ricerca → griglia
  carte, così il campo non finisce mai sotto al notch/Dynamic Island di iPhone (prima
  era troppo in alto). Scan e la vista fullscreen del barcode restano a schermo intero,
  senza tab bar.
- **[MVP]** Badge carta nella griglia: sfondo blu pieno (stessa palette di banner/tab
  bar) con il nome della carta centrato, grande, in grassetto e bianco - il modo
  primario per riconoscerla, non il logo. Il logo del negozio, quando disponibile, è
  solo un cerchietto piccolo sotto al nome (le favicon ingrandite a piena carta
  risultavano piccole/sfocate); senza logo, nessun cerchietto, solo la scritta
  centrata. Pulsanti azione (preferito/modifica/condividi) in alto a destra, badge
  "condivisa" in alto a sinistra.
- **[MVP]** Ricerca istantanea client-side (Fuse.js) su tutte le carte caricate in cache locale.
- **[MVP]** Vista fullscreen del barcode con Screen Wake Lock (evita spegnimento schermo alla cassa),
  nome del negozio/carta in grande e in grassetto. Per EAN-13/EAN-8 il rendering ricentra il
  codice misurando i pixel disegnati (`lib/centerBarcodeCanvas.ts`) e aggiungendo margine
  bianco dal lato più corto: senza, la cifra iniziale stampata fuori dalle barre occupa
  spazio solo a sinistra e il codice appare visibilmente spostato a destra (bug verificato
  pixel per pixel sul canvas grezzo, non era un problema di notch/safe-area come ipotizzato
  in un primo momento). Non si usa l'opzione `guardwhitespace` di bwip-js perché aggiunge gli
  indicatori "<"/">" ben visibili accanto al codice, fuori posto su una carta fedeltà. Per i
  QR code, l'opzione `height` di bwip-js (pensata per l'altezza delle barre nei formati
  lineari) viene omessa: passata a un codice a matrice lo stira in verticale invece di
  scalarlo, deformando un quadrato in un rettangolo (232×435px anziché 232×232px, verificato
  con bwip-js in Node) - un QR deformato può anche non essere più leggibile da uno scanner.
- **[MVP]** Sezione "Recenti" per accesso rapido alle carte usate più spesso.
- **[MVP]** Preferiti: tab dedicato con le carte segnate con la stella (☆/★ su ogni carta).
  È una preferenza personale per utente (tabella separata `card_favorites`), non un campo
  sulla carta: segnare come preferita una carta condivisa non la rende tale anche per chi
  l'ha condivisa, e viceversa.
- **[MVP]** Modifica (nome, codice, formato, negozio, note) ed eliminazione di una carta
  posseduta, dalla lista carte (pulsante ✎). Un utente con permesso "può modificare" su
  una carta condivisa può già farlo via API, ma non ha ancora un pulsante nell'interfaccia
  per questo (solo il proprietario vede ✎ nella lista) — eliminare resta comunque
  possibile solo al proprietario.
- Ordinamento per categoria, tag personalizzati.

## 5. Multiutente e condivisione
- **[MVP]** Modello dati: `Card` (owner) + `CardShare` (utente destinatario, permesso view/edit).
- **[MVP]** Interfaccia di condivisione: pulsante "condividi" (⇪) su ogni carta posseduta,
  apre un modal per condividere per username con permesso sola-lettura/modifica, vedere
  con chi è già condivisa e rimuovere una condivisione.
- **[MVP]** Autocomplete sul campo username in ogni form di condivisione (`GET /api/users?q=`):
  cerca tra gli utenti già registrati per username o nome visualizzato, esclude sempre se
  stessi e non espone mai l'email. Serve solo a comodità: si può comunque digitare uno
  username esatto senza selezionarlo dal suggerimento.
- **[MVP]** Condivisione dell'intera libreria (Impostazioni → "Condividi l'intera libreria"):
  a differenza di `CardShare` (una carta alla volta), `LibraryShare` vale per proprietario,
  quindi copre anche le carte aggiunte dopo la condivisione, non è una fotografia del momento.
  Una carta condivisa sia singolarmente sia via libreria non compare duplicata; se i due
  permessi differiscono, quello più permissivo tra i due si applica alla modifica (i preferiti
  bastano un accesso in lettura qualsiasi). Eliminare una carta resta comunque possibile solo
  al proprietario, indipendentemente dal tipo di condivisione.
- **[MVP]** Link di invito con token e scadenza (72h di default), generabile dallo stesso
  modal, per chi non ha ancora ricevuto una condivisione diretta ma ha già un account.
  Accettarlo (pagina `/invite/:token`) richiede login: se non sei autenticato, l'app ti
  manda al login e riprende automaticamente l'accettazione subito dopo. Non esiste ancora
  un equivalente link di invito per la condivisione dell'intera libreria (richiede username
  di un utente già registrato).
- Gruppi "famiglia": carte condivise automaticamente con tutti i membri del gruppo.
- Invito via link utilizzabile anche da chi non ha ancora un account (oggi serve che
  l'amministratore crei prima l'utente via CLI).

## 6. Gestione via web
- **[MVP]** Stessa PWA responsive, utilizzabile da browser desktop.
- Pannello amministrativo per il catalogo negozi/loghi (merge duplicati, upload logo manuale).

## 7. Backup e ripristino (locale)
- **[MVP]** Container `backup` schedulato via cron → `pg_dump` del database su `./backups`,
  di default settimanale (domenica alle 3:00), orario configurabile per intero tramite
  `BACKUP_SCHEDULE_CRON` (in `.env`): il container legge la variabile e rigenera la
  crontab ad ogni avvio, non è un orario fisso incorporato nell'immagine.
- **[MVP]** Rotazione automatica: ad ogni backup, quelli più vecchi degli ultimi
  `BACKUP_KEEP_LAST` (in `.env`) vengono cancellati automaticamente.
- **[MVP]** Script `restore.sh` per ripristino manuale da un backup specifico.
- Export utente singolo (zip con metadati + immagini), scaricabile dall'app.

## 8. PWA / offline

Requisito fondamentale: le carte gia' sincronizzate devono restare **completamente
utilizzabili senza connessione** (es. al supermercato senza campo).

- **[MVP]** Manifest + service worker (installabile su iPhone da Safari, "Aggiungi a Home").
- **[MVP]** Precache dell'intera app shell (JS/CSS/HTML): l'app si apre e naviga tra le
  pagine anche a connessione completamente assente, non solo con dati gia' caricati.
- **[MVP]** `navigateFallback` su `index.html` (Workbox): l'app usa routing client-side
  (react-router), quindi rotte come `/scan` o `/card/:id` non corrispondono a file reali.
  Senza questo, aprire direttamente una di queste rotte offline (es. la PWA che riapre
  l'ultima schermata visitata) andava in rete, falliva e mostrava una pagina bianca;
  `/api/` resta escluso dal fallback per non intercettare le chiamate al backend.
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
