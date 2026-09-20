import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserAutocomplete from "../components/UserAutocomplete";
import { api } from "../lib/api";
import { refreshCards } from "../lib/cardCache";
import type { Share, SharePermission, User } from "../types";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [libraryShares, setLibraryShares] = useState<Share[]>([]);
  const [username, setUsername] = useState("");
  const [permission, setPermission] = useState<SharePermission>("view");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.me().then(setUser).catch(() => {
      /* offline: le impostazioni restano usabili, solo senza il nome utente */
    });
    loadLibraryShares();
  }, []);

  function loadLibraryShares() {
    api.listLibraryShares().catch(() => []).then((shares) => setLibraryShares(shares || []));
  }

  function handleLogout() {
    api.logout();
    navigate("/login");
  }

  async function handleShareLibrary(e: FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    setError(null);
    setBusy(true);
    try {
      await api.shareLibrary(username.trim(), permission);
      setUsername("");
      loadLibraryShares();
      // Chi riceve la condivisione potrebbe gia' avere la nostra libreria in
      // cache con permessi diversi: forziamo un refresh anche qui per coerenza.
      await refreshCards().catch(() => {});
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRevokeLibraryShare(userId: string) {
    setError(null);
    try {
      await api.revokeLibraryShare(userId);
      loadLibraryShares();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="tab-page">
      <h1>Impostazioni</h1>

      {user && (
        <p className="hint">
          Connesso come <strong>{user.display_name || user.username}</strong>
        </p>
      )}

      <section className="share-list-section">
        <h3>Condividi l'intera libreria</h3>
        <p className="hint">
          A differenza della condivisione di una singola carta, la persona vedrà anche le carte che
          aggiungerai in futuro.
        </p>

        <form className="card-form" onSubmit={handleShareLibrary}>
          <UserAutocomplete value={username} onChange={setUsername} />
          <select value={permission} onChange={(e) => setPermission(e.target.value as SharePermission)}>
            <option value="view">Sola lettura</option>
            <option value="edit">Può modificare</option>
          </select>
          <button type="submit" disabled={busy || !username.trim()}>
            Condividi libreria
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {libraryShares.length > 0 && (
          <ul className="share-list">
            {libraryShares.map((s) => (
              <li key={s.user_id}>
                <span>
                  {s.display_name || s.username}{" "}
                  <span className="hint">({s.permission === "edit" ? "può modificare" : "sola lettura"})</span>
                </span>
                <button className="secondary" onClick={() => handleRevokeLibraryShare(s.user_id)}>
                  Rimuovi
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="danger-zone">
        <button className="secondary" onClick={handleLogout}>
          Esci
        </button>
      </div>
    </div>
  );
}
