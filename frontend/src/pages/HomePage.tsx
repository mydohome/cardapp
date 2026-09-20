import { useEffect, useState } from "react";
import CardTile from "../components/CardTile";
import EditCardModal from "../components/EditCardModal";
import ShareModal from "../components/ShareModal";
import { api } from "../lib/api";
import { getRecentCards, refreshCards, searchCards } from "../lib/cardCache";
import { useOnlineStatus } from "../lib/useOnlineStatus";
import type { Card } from "../types";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Card[]>([]);
  const [recents, setRecents] = useState<Card[]>([]);
  const [sharingCard, setSharingCard] = useState<Card | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const online = useOnlineStatus();

  useEffect(() => {
    // Carica subito la cache locale (istantaneo, funziona anche offline)
    // poi la aggiorna in background con i dati freschi dal server.
    setResults(searchCards(""));
    setRecents(getRecentCards());
    refreshCards()
      .then(() => {
        setResults(searchCards(query));
        setRecents(getRecentCards());
      })
      .catch(() => {
        /* offline: si resta sulla cache locale */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    setResults(searchCards(value));
  }

  function refreshView() {
    setResults(searchCards(query));
    setRecents(getRecentCards());
  }

  function handleModalClose() {
    setSharingCard(null);
    setEditingCard(null);
    // La carta potrebbe essere stata modificata/eliminata: aggiorna subito la vista.
    refreshView();
  }

  async function handleToggleFavorite(card: Card) {
    try {
      await api.setFavorite(card.id, !card.is_favorite);
      await refreshCards();
      refreshView();
    } catch {
      /* offline o errore di rete: il preferito non e' modificabile senza connessione */
    }
  }

  return (
    <div className="tab-page">
      {!online && (
        <div className="offline-banner">
          Sei offline: stai vedendo le carte salvate sul dispositivo.
        </div>
      )}
      <input
        autoFocus
        className="search-input search-input-full"
        placeholder="Cerca carta o negozio..."
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
      />

      {!query && recents.length > 0 && (
        <section>
          <h2>Recenti</h2>
          <div className="card-grid">
            {recents.map((c) => (
              <CardTile
                key={c.id}
                card={c}
                onShare={setSharingCard}
                onEdit={setEditingCard}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2>{query ? "Risultati" : "Tutte le carte"}</h2>
        <div className="card-grid">
          {results.map((c) => (
            <CardTile
              key={c.id}
              card={c}
              onShare={setSharingCard}
              onEdit={setEditingCard}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
          {results.length === 0 && <p className="empty">Nessuna carta trovata.</p>}
        </div>
      </section>

      {sharingCard && <ShareModal card={sharingCard} onClose={handleModalClose} />}
      {editingCard && <EditCardModal card={editingCard} onClose={handleModalClose} />}
    </div>
  );
}
