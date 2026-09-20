import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Store } from "../types";

/** Campo negozio con autocomplete e anteprima del logo, usato sia in
 * creazione (ScanCardPage) sia in modifica (EditCardModal) di una carta. */
export default function StoreAutocomplete({
  query,
  onQueryChange,
  selected,
  onSelect,
  placeholder = "Negozio (per il logo)",
}: {
  query: string;
  onQueryChange: (value: string) => void;
  selected: Store | null;
  onSelect: (store: Store | null) => void;
  placeholder?: string;
}) {
  const [results, setResults] = useState<Store[]>([]);

  useEffect(() => {
    // Non cercare se il campo mostra ancora il negozio gia' selezionato.
    if (!query.trim() || (selected && query === selected.name)) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      api
        .searchStores(query.trim())
        .then(setResults)
        .catch(() => {
          /* la ricerca negozio non e' essenziale al salvataggio: ignoriamo errori */
        });
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, selected]);

  return (
    <div className="autocomplete">
      <input
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          onQueryChange(e.target.value);
          onSelect(null);
        }}
      />
      {results.length > 0 && (
        <ul className="autocomplete-suggestions">
          {results.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="secondary store-suggestion"
                onClick={() => {
                  onSelect(s);
                  onQueryChange(s.name);
                  setResults([]);
                }}
              >
                <StoreSuggestionLogo store={s} />
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StoreSuggestionLogo({ store }: { store: Store }) {
  const [failed, setFailed] = useState(false);
  if (store.logo_url && !failed) {
    return (
      <img src={store.logo_url} alt="" className="store-suggestion-logo" onError={() => setFailed(true)} />
    );
  }
  return <span className="store-suggestion-logo placeholder">{store.name[0]?.toUpperCase()}</span>;
}
