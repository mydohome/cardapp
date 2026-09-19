import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const PENDING_INVITE_KEY = "pending_invite_token";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.login(username, password);

      const pendingInvite = sessionStorage.getItem(PENDING_INVITE_KEY);
      if (pendingInvite) {
        sessionStorage.removeItem(PENDING_INVITE_KEY);
        navigate(`/invite/${pendingInvite}`);
      } else {
        navigate("/");
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="centered-page">
      <form className="card-form" onSubmit={handleSubmit}>
        <h1>CardApp</h1>
        <input
          type="text"
          placeholder="Username o email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Accedi</button>
      </form>
    </div>
  );
}
