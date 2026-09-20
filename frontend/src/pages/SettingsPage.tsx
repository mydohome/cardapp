import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { User } from "../types";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.me().then(setUser).catch(() => {
      /* offline: le impostazioni restano usabili, solo senza il nome utente */
    });
  }, []);

  function handleLogout() {
    api.logout();
    navigate("/login");
  }

  return (
    <div className="tab-page">
      <h1>Impostazioni</h1>

      {user && (
        <p className="hint">
          Connesso come <strong>{user.display_name || user.username}</strong>
        </p>
      )}

      <div className="danger-zone">
        <button className="secondary" onClick={handleLogout}>
          Esci
        </button>
      </div>
    </div>
  );
}
