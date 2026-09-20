import { useState } from "react";
import { Link } from "react-router-dom";
import type { Card } from "../types";

export default function CardTile({
  card,
  onShare,
  onEdit,
  onToggleFavorite,
}: {
  card: Card;
  onShare: (card: Card) => void;
  onEdit: (card: Card) => void;
  onToggleFavorite: (card: Card) => void;
}) {
  // Se il logo non e' in cache e siamo offline (o l'URL non e' piu' raggiungibile),
  // si passa al placeholder invece di mostrare un'icona rotta.
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = card.store?.logo_url && !logoFailed;
  const isOwn = !card.shared_by;

  return (
    <div className="card-tile-wrapper">
      <Link to={`/card/${card.id}`} className="card-tile">
        {showLogo ? (
          <img
            src={card.store!.logo_url!}
            alt=""
            className="card-tile-bg"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <div className="card-tile-bg card-tile-bg-placeholder">{card.label[0]?.toUpperCase()}</div>
        )}
        {card.shared_by && <span className="badge badge-shared">condivisa</span>}
        <div className="card-tile-label-bar">
          <span className="card-label">{card.label}</span>
        </div>
      </Link>
      <div className="tile-actions">
        <button
          className="tile-action-btn"
          aria-label={card.is_favorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(card);
          }}
        >
          {card.is_favorite ? "★" : "☆"}
        </button>
        {isOwn && (
          <>
            <button
              className="tile-action-btn"
              aria-label="Modifica"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(card);
              }}
            >
              ✎
            </button>
            <button
              className="tile-action-btn"
              aria-label="Condividi"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onShare(card);
              }}
            >
              ⇪
            </button>
          </>
        )}
      </div>
    </div>
  );
}
