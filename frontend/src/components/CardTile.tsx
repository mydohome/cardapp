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
  // si nasconde il cerchietto invece di mostrare un'icona rotta: la scritta
  // grande resta comunque il modo principale di riconoscere la carta.
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = card.store?.logo_url && !logoFailed;
  const isOwn = !card.shared_by;

  return (
    <div className="card-tile-wrapper">
      <Link to={`/card/${card.id}`} className="card-tile">
        {card.shared_by && <span className="badge badge-shared">condivisa</span>}
        <span className={"card-label" + (showLogo ? " has-logo" : "")}>{card.label}</span>
        {showLogo && (
          <span className="card-tile-logo-circle">
            <img src={card.store!.logo_url!} alt="" onError={() => setLogoFailed(true)} />
          </span>
        )}
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
