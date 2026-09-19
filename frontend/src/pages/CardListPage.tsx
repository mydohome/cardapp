import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { getRecentCards, refreshCards, searchCards } from "../lib/cardCache";
import { useOnlineStatus } from "../lib/useOnlineStatus";
import type { Card } from "../types";

export default function CardListPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Card[]>([]);
  const [recents, setRecents] = useState<Card[]>([]);
  const navigate = useNavigate();
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

  return (
    <div className="page">
      {!online && (
        <div className="offline-banner">
          Sei offline: stai vedendo le carte salvate sul dispositivo.
        </div>
      )}
      <header className="list-header">
        <input
          autoFocus
          className="search-input"
          placeholder="Cerca carta o negozio..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
        />
        <div className="header-actions">
          <button onClick={() => navigate("/scan")}>+ Scansiona</button>
          <button
            className="secondary"
            onClick={() => {
              api.logout();
              navigate("/login");
            }}
          >
            Esci
          </button>
        </div>
      </header>

      {!query && recents.length > 0 && (
        <section>
          <h2>Recenti</h2>
          <div className="card-grid">
            {recents.map((c) => (
              <CardTile key={c.id} card={c} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2>{query ? "Risultati" : "Tutte le carte"}</h2>
        <div className="card-grid">
          {results.map((c) => (
            <CardTile key={c.id} card={c} />
          ))}
          {results.length === 0 && <p className="empty">Nessuna carta trovata.</p>}
        </div>
      </section>
    </div>
  );
}

function CardTile({ card }: { card: Card }) {
  // Se il logo non e' in cache e siamo offline (o l'URL non e' piu' raggiungibile),
  // si passa al placeholder invece di mostrare un'icona rotta.
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = card.store?.logo_url && !logoFailed;

  return (
    <Link to={`/card/${card.id}`} className="card-tile">
      {showLogo ? (
        <img
          src={card.store!.logo_url!}
          alt=""
          className="card-logo"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <div className="card-logo placeholder">{card.label[0]?.toUpperCase()}</div>
      )}
      <span className="card-label">{card.label}</span>
      {card.shared_by && <span className="badge">condivisa</span>}
    </Link>
  );
}
