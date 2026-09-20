import { NavLink } from "react-router-dom";

const TABS: { to: string; icon: string; label: string; end?: boolean }[] = [
  { to: "/scan", icon: "＋", label: "Scan" },
  { to: "/", icon: "🔍", label: "Ricerca", end: true },
  { to: "/favorites", icon: "★", label: "Preferiti" },
  { to: "/settings", icon: "⚙", label: "Impostazioni" },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => "bottom-nav-item" + (isActive ? " active" : "")}
        >
          <span className="bottom-nav-icon" aria-hidden="true">
            {tab.icon}
          </span>
          <span className="bottom-nav-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
