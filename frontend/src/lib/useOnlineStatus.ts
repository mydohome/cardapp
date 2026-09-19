import { useEffect, useState } from "react";

/** true/false in base agli eventi online/offline del browser.
 *
 * Nota: indica solo se il dispositivo ha una connessione di rete, non se il
 * backend e' raggiungibile (es. Wi-Fi connesso ma senza Internet reale).
 * Le carte gia' sincronizzate restano comunque disponibili da cache locale
 * indipendentemente da questo stato: serve solo a informare l'utente.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}
