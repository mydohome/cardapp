import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { UserSummary } from "../types";

/** Campo username con autocomplete tra gli utenti già registrati, usato sia
 * per la condivisione di una singola carta sia per quella dell'intera libreria. */
export default function UserAutocomplete({
  value,
  onChange,
  placeholder = "Username della persona",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [results, setResults] = useState<UserSummary[]>([]);

  useEffect(() => {
    if (!value.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      api
        .searchUsers(value.trim())
        .then(setResults)
        .catch(() => {
          /* l'autocomplete non e' essenziale alla condivisione: ignoriamo errori */
        });
    }, 250);
    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <div className="autocomplete">
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoCapitalize="none"
        autoCorrect="off"
      />
      {results.length > 0 && (
        <ul className="autocomplete-suggestions">
          {results.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  onChange(u.username);
                  setResults([]);
                }}
              >
                {u.display_name ? `${u.display_name} (${u.username})` : u.username}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
