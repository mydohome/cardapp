import { BarcodeFormat as ZXingFormat, BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import type { Result } from "@zxing/library";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import StoreAutocomplete from "../components/StoreAutocomplete";
import { api } from "../lib/api";
import { BARCODE_FORMATS } from "../lib/barcodeFormats";
import { refreshCards } from "../lib/cardCache";
import { useOnlineStatus } from "../lib/useOnlineStatus";
import type { BarcodeFormat, Store } from "../types";

const ZXING_FORMAT_MAP: Partial<Record<ZXingFormat, BarcodeFormat>> = {
  [ZXingFormat.EAN_13]: "EAN13",
  [ZXingFormat.EAN_8]: "EAN8",
  [ZXingFormat.CODE_128]: "CODE128",
  [ZXingFormat.CODE_39]: "CODE39",
  [ZXingFormat.QR_CODE]: "QRCODE",
  [ZXingFormat.PDF_417]: "PDF417",
  [ZXingFormat.AZTEC]: "AZTEC",
  [ZXingFormat.CODABAR]: "CODABAR",
};

/** Normalizza il risultato dello scan: UPC-A e' letteralmente un EAN-13 a cui
 * e' stato tolto lo "0" iniziale (il "system digit"). ZXing spesso preferisce
 * riconoscere come UPC-A un barcode fisicamente EAN-13 che comincia per 0,
 * facendo sparire quella cifra se non la ripristiniamo qui. */
function normalizeScanResult(result: Result): { value: string; format: BarcodeFormat } {
  const zxingFormat = result.getBarcodeFormat();
  if (zxingFormat === ZXingFormat.UPC_A) {
    return { value: `0${result.getText()}`, format: "EAN13" };
  }
  return { value: result.getText(), format: ZXING_FORMAT_MAP[zxingFormat] ?? "CODE128" };
}

export default function ScanCardPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const navigate = useNavigate();
  const online = useOnlineStatus();

  const [barcodeValue, setBarcodeValue] = useState("");
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>("EAN13");
  // Vero quando l'utente sceglie di scrivere il codice a mano invece di
  // aspettare uno scan riuscito: senza, chi ha un barcode che la fotocamera
  // (o l'OCR sulla foto) non riescono a leggere resterebbe bloccato senza
  // alcun modo di aggiungere comunque la carta.
  const [manualEntry, setManualEntry] = useState(false);
  const [label, setLabel] = useState("");
  const [storeQuery, setStoreQuery] = useState("");
  const [store, setStore] = useState<Store | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const showForm = !!barcodeValue || manualEntry;

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let cancelled = false;

    reader
      .decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current!,
        (result) => {
          if (result) {
            const normalized = normalizeScanResult(result);
            setBarcodeValue(normalized.value);
            setBarcodeFormat(normalized.format);
          }
        }
      )
      .then((controls) => {
        // Se il componente e' gia' stato smontato (es. utente ha premuto
        // "Indietro" prima che la fotocamera finisse di inizializzarsi),
        // ferma subito lo stream invece di lasciarlo acceso in background.
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      })
      .catch(() => setError("Impossibile accedere alla fotocamera. Usa il caricamento foto o l'inserimento manuale qui sotto."));

    return () => {
      // Senza stop() lo stream della fotocamera resta attivo anche dopo aver
      // lasciato la pagina (l'unmount da solo non ferma le tracce del MediaStream).
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  function handleCancel() {
    controlsRef.current?.stop();
    navigate("/");
  }

  function handleManualEntry() {
    // La fotocamera resta accesa finche' non gliela si ferma esplicitamente:
    // senza, potrebbe decodificare qualcosa mentre l'utente sta scrivendo a
    // mano e sovrascrivergli il campo a sua insaputa.
    controlsRef.current?.stop();
    setManualEntry(true);
  }

  async function handlePhotoUpload(file: File) {
    setError(null);
    try {
      const result = await api.recognizePhoto(file);
      if (result.decoded_barcode_value) setBarcodeValue(result.decoded_barcode_value);
      if (result.decoded_barcode_format) setBarcodeFormat(result.decoded_barcode_format as BarcodeFormat);
      if (result.matched_store) {
        setStore(result.matched_store);
        setLabel(result.matched_store.name);
        setStoreQuery(result.matched_store.name);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleSave() {
    if (!barcodeValue.trim() || !label.trim()) return;
    setSaving(true);
    try {
      await api.createCard({
        label,
        barcode_value: barcodeValue.trim(),
        barcode_format: barcodeFormat,
        store_id: store?.id,
      });
      await refreshCards();
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="header-actions">
        <button className="secondary" onClick={handleCancel}>
          ← Indietro
        </button>
      </div>
      <h1>Aggiungi carta</h1>

      {!online && (
        <div className="offline-banner">
          Sei offline: puoi scansionare il codice, ma per salvare la carta serve una connessione.
        </div>
      )}

      {!showForm && (
        <>
          <video ref={videoRef} className="scan-video" muted playsInline />
          <p className="hint">Inquadra il barcode della carta.</p>
          <div className="or-divider">oppure</div>
          <label className="upload-btn">
            Carica una foto della carta
            <input
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
            />
          </label>
          <div className="or-divider">oppure</div>
          <button className="secondary" onClick={handleManualEntry}>
            Inserisci il codice a mano
          </button>
        </>
      )}

      {showForm && (
        <div className="card-form">
          {manualEntry ? (
            <p className="hint">
              Scrivi il codice così come stampato sulla carta e scegli il formato giusto (se non lo
              sai, prova con quello più simile all'aspetto del barcode: a barre verticali è quasi
              sempre EAN13 o CODE128, un quadrato di puntini è QRCODE).
            </p>
          ) : (
            <p>
              Codice rilevato: <strong>{barcodeValue}</strong>
            </p>
          )}
          <input
            placeholder="Codice a barre"
            value={barcodeValue}
            onChange={(e) => setBarcodeValue(e.target.value)}
          />
          <select value={barcodeFormat} onChange={(e) => setBarcodeFormat(e.target.value as BarcodeFormat)}>
            {BARCODE_FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <input
            placeholder="Nome carta (es. Esselunga Fidaty)"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              // Comodita': finche' non si sceglie un negozio dai suggerimenti,
              // la ricerca segue quello che si scrive qui, cosi' il logo si
              // suggerisce da solo senza dover scrivere il nome due volte.
              if (!store) setStoreQuery(e.target.value);
            }}
          />
          <StoreAutocomplete query={storeQuery} onQueryChange={setStoreQuery} selected={store} onSelect={setStore} />
          <button disabled={saving || !label.trim() || !barcodeValue.trim()} onClick={handleSave}>
            {saving ? "Salvataggio..." : "Salva carta"}
          </button>
          {!manualEntry && (
            <button className="secondary" onClick={() => setBarcodeValue("")}>
              Riprova
            </button>
          )}
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
