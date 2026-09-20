import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import TopBanner from "./TopBanner";

/** Layout condiviso dalle schermate principali (Ricerca, Preferiti, Impostazioni):
 * banner in alto + contenuto della rotta attiva + tab bar in basso. Scan e la
 * vista fullscreen del barcode restano fuori da questo layout (schermo intero,
 * senza tab bar, per non distrarre durante scansione/lettura alla cassa). */
export default function AppShell() {
  return (
    <div className="app-shell">
      <TopBanner />
      <div className="app-shell-content">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
