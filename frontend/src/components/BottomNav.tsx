import { NavLink, useLocation } from "react-router-dom";
import type { ComponentType } from "react";
import { ScanIcon, SearchIcon, SettingsIcon, StarIcon } from "./icons";

interface Tab {
  to: string;
  label: string;
  Icon: ComponentType<{ className?: string; filled?: boolean }>;
  end?: boolean;
}

const TABS: Tab[] = [
  { to: "/scan", label: "Scan", Icon: ScanIcon },
  { to: "/", label: "Ricerca", Icon: SearchIcon, end: true },
  { to: "/favorites", label: "Preferiti", Icon: StarIcon },
  { to: "/settings", label: "Impostazioni", Icon: SettingsIcon },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {TABS.map(({ to, label, Icon, end }) => {
        const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={"bottom-nav-item" + (isActive ? " active" : "")}
          >
            <span className="bottom-nav-icon">
              <Icon className="bottom-nav-svg" filled={label === "Preferiti" && isActive} />
            </span>
            <span className="bottom-nav-label">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
