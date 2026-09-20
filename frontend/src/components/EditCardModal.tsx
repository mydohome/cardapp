import { FormEvent, useState } from "react";
import StoreAutocomplete from "./StoreAutocomplete";
import { api } from "../lib/api";
import { BARCODE_FORMATS } from "../lib/barcodeFormats";
import { refreshCards } from "../lib/cardCache";
import type { BarcodeFormat, Card, Store } from "../types";

export default function EditCardModal({ card, onClose }: { card: Card; onClose: () => void }) {
  const [label, setLabel] = useState(card.label);
  const [barcodeValue, setBarcodeValue] = useState(card.barcode_value);
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>(card.barcode_format);
  const [notes, setNotes] = useState(card.notes ?? "");
  const [storeQuery, setStoreQuery] = useState(card.store?.name ?? "");
  const [selectedStore, setSelectedStore] = useState<Store | null>(card.store ?? null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.updateCard(card.id, {
        label,
        barcode_value: barcodeValue,
        barcode_format: barcodeFormat,
        notes: notes.trim() || null,
        store_id: selectedStore?.id ?? null,
      });
      await refreshCards();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      await api.deleteCard(card.id);
      await refreshCards();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Modifica carta</h2>

        <form className="card-form" onSubmit={handleSave}>
          <input placeholder="Nome carta" value={label} onChange={(e) => setLabel(e.target.value)} required />
          <input
            placeholder="Codice a barre"
            value={barcodeValue}
            onChange={(e) => setBarcodeValue(e.target.value)}
            required
          />
          <select value={barcodeFormat} onChange={(e) => setBarcodeFormat(e.target.value as BarcodeFormat)}>
            {BARCODE_FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          <StoreAutocomplete
            query={storeQuery}
            onQueryChange={setStoreQuery}
            selected={selectedStore}
            onSelect={setSelectedStore}
          />

          <textarea
            placeholder="Note (opzionale)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={busy || !label.trim() || !barcodeValue.trim()}>
            {busy ? "Salvataggio..." : "Salva modifiche"}
          </button>
        </form>

        <div className="danger-zone">
          {!confirmingDelete ? (
            <button className="secondary danger" onClick={() => setConfirmingDelete(true)}>
              Elimina carta
            </button>
          ) : (
            <>
              <p className="hint">Eliminare definitivamente questa carta? Non si può annullare.</p>
              <div className="header-actions">
                <button className="danger" disabled={busy} onClick={handleDelete}>
                  Sì, elimina
                </button>
                <button className="secondary" onClick={() => setConfirmingDelete(false)}>
                  Annulla
                </button>
              </div>
            </>
          )}
        </div>

        <button className="secondary" onClick={onClose}>
          Chiudi
        </button>
      </div>
    </div>
  );
}
