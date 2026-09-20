import { useEffect, useState } from "react";
import CardTile from "../components/CardTile";
import EditCardModal from "../components/EditCardModal";
import ShareModal from "../components/ShareModal";
import { api } from "../lib/api";
import { getFavoriteCards, refreshCards } from "../lib/cardCache";
import type { Card } from "../types";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Card[]>([]);
  const [sharingCard, setSharingCard] = useState<Card | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  useEffect(() => {
    setFavorites(getFavoriteCards());
    refreshCards()
      .then(() => setFavorites(getFavoriteCards()))
      .catch(() => {
        /* offline: si resta sulla cache locale */
      });
  }, []);

  function handleModalClose() {
    setSharingCard(null);
    setEditingCard(null);
    setFavorites(getFavoriteCards());
  }

  async function handleToggleFavorite(card: Card) {
    try {
      await api.setFavorite(card.id, !card.is_favorite);
      await refreshCards();
      setFavorites(getFavoriteCards());
    } catch {
      /* offline o errore di rete: il preferito non e' modificabile senza connessione */
    }
  }

  return (
    <div className="tab-page">
      <h1>Preferiti</h1>
      <div className="card-grid">
        {favorites.map((c) => (
          <CardTile
            key={c.id}
            card={c}
            onShare={setSharingCard}
            onEdit={setEditingCard}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
        {favorites.length === 0 && <p className="empty">Nessuna carta tra i preferiti.</p>}
      </div>

      {sharingCard && <ShareModal card={sharingCard} onClose={handleModalClose} />}
      {editingCard && <EditCardModal card={editingCard} onClose={handleModalClose} />}
    </div>
  );
}
