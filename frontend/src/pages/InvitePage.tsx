import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { refreshCards } from "../lib/cardCache";

const PENDING_INVITE_KEY = "pending_invite_token";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    if (!localStorage.getItem("access_token")) {
      // Non sei loggato: salva il token dell'invito e riprendilo dopo il login.
      sessionStorage.setItem(PENDING_INVITE_KEY, token);
      navigate("/login");
      return;
    }

    api
      .acceptInvite(token)
      .then(async () => {
        await refreshCards();
        setStatus("ok");
      })
      .catch((err) => {
        setMessage((err as Error).message);
        setStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (status === "loading") {
    return (
      <div className="centered-page">
        <p>Verifica invito...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="centered-page">
        <div className="card-form">
          <p className="error">Impossibile accettare l'invito: {message}</p>
          <button onClick={() => navigate("/")}>Torna alla lista</button>
        </div>
      </div>
    );
  }

  return (
    <div className="centered-page">
      <div className="card-form">
        <p>Carta aggiunta alle tue carte condivise.</p>
        <button onClick={() => navigate("/")}>Vai alla lista</button>
      </div>
    </div>
  );
}
