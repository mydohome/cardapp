import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";
import UserAutocomplete from "./UserAutocomplete";
import type { Card, Share, SharePermission } from "../types";

export default function ShareModal({ card, onClose }: { card: Card; onClose: () => void }) {
  const [shares, setShares] = useState<Share[]>([]);
  const [username, setUsername] = useState("");
  const [permission, setPermission] = useState<SharePermission>("view");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadShares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadShares() {
    try {
      setShares(await api.listShares(card.id));
    } catch {
      /* se fallisce mostriamo solo la lista vuota, non e' bloccante */
    }
  }

  async function handleShare(e: FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    setError(null);
    setBusy(true);
    try {
      await api.shareCard(card.id, username.trim(), permission);
      setUsername("");
      await loadShares();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(userId: string) {
    setError(null);
    try {
      await api.revokeShare(card.id, userId);
      await loadShares();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleCreateInvite() {
    setError(null);
    setBusy(true);
    try {
      const invite = await api.createInvite(card.id, permission);
      setInviteLink(`${window.location.origin}/invite/${invite.token}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCopyLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch {
      /* clipboard non disponibile: il link resta comunque selezionabile a mano */
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Condividi "{card.label}"</h2>

        <form className="card-form" onSubmit={handleShare}>
          <UserAutocomplete value={username} onChange={setUsername} />
          <select value={permission} onChange={(e) => setPermission(e.target.value as SharePermission)}>
            <option value="view">Sola lettura</option>
            <option value="edit">Può modificare</option>
          </select>
          <button type="submit" disabled={busy || !username.trim()}>
            Condividi
          </button>
        </form>

        <div className="or-divider">oppure</div>

        <button className="secondary" onClick={handleCreateInvite} disabled={busy}>
          Genera link di invito
        </button>
        {inviteLink && (
          <div className="invite-link-box">
            <input readOnly value={inviteLink} onFocus={(e) => e.target.select()} />
            <button className="secondary" onClick={handleCopyLink}>
              Copia
            </button>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        {shares.length > 0 && (
          <div className="share-list-section">
            <h3>Condivisa con</h3>
            <ul className="share-list">
              {shares.map((s) => (
                <li key={s.user_id}>
                  <span>
                    {s.display_name || s.username}{" "}
                    <span className="hint">({s.permission === "edit" ? "può modificare" : "sola lettura"})</span>
                  </span>
                  <button className="secondary" onClick={() => handleRevoke(s.user_id)}>
                    Rimuovi
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button className="secondary" onClick={onClose}>
          Chiudi
        </button>
      </div>
    </div>
  );
}
