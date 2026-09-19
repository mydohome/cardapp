import { BrowserMultiFormatReader } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { refreshCards } from "../lib/cardCache";
import { useOnlineStatus } from "../lib/useOnlineStatus";
import type { Store } from "../types";

export default function ScanCardPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const navigate = useNavigate();
  const online = useOnlineStatus();

  const [barcodeValue, setBarcodeValue] = useState("");
  const [label, setLabel] = useState("");
  const [store, setStore] = useState<Store | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader
      .decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current!,
        (result) => {
          if (result) {
            setBarcodeValue(result.getText());
          }
        }
      )
      .catch(() => setError("Impossibile accedere alla fotocamera. Usa il caricamento foto qui sotto."));

    return () => {
      readerRef.current = null;
    };
  }, []);

  async function handlePhotoUpload(file: File) {
    setError(null);
    try {
      const result = await api.recognizePhoto(file);
      if (result.decoded_barcode_value) setBarcodeValue(result.decoded_barcode_value);
      if (result.matched_store) {
        setStore(result.matched_store);
        setLabel(result.matched_store.name);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleSave() {
    if (!barcodeValue || !label) return;
    setSaving(true);
    try {
      await api.createCard({
        label,
        barcode_value: barcodeValue,
        barcode_format: "EAN13",
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
      <h1>Aggiungi carta</h1>

      {!online && (
        <div className="offline-banner">
          Sei offline: puoi scansionare il codice, ma per salvare la carta serve una connessione.
        </div>
      )}

      {!barcodeValue && (
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
        </>
      )}

      {barcodeValue && (
        <div className="card-form">
          <p>Codice rilevato: <strong>{barcodeValue}</strong></p>
          <input
            placeholder="Nome carta (es. Esselunga Fidaty)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          {store && <p>Negozio riconosciuto: {store.name}</p>}
          <button disabled={saving || !label} onClick={handleSave}>
            {saving ? "Salvataggio..." : "Salva carta"}
          </button>
          <button className="secondary" onClick={() => setBarcodeValue("")}>
            Riprova
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
