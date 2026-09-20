import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import CardFullscreenPage from "./pages/CardFullscreenPage";
import FavoritesPage from "./pages/FavoritesPage";
import HomePage from "./pages/HomePage";
import InvitePage from "./pages/InvitePage";
import LoginPage from "./pages/LoginPage";
import ScanCardPage from "./pages/ScanCardPage";
import SettingsPage from "./pages/SettingsPage";

function isAuthenticated() {
  return !!localStorage.getItem("access_token");
}

function PrivateRoute({ children }: { children: JSX.Element }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invite/:token" element={<InvitePage />} />

      {/* Schermate principali: banner in alto + tab bar in basso (Ricerca/Preferiti/Impostazioni). */}
      <Route
        element={
          <PrivateRoute>
            <AppShell />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fuori dal layout a tab: schermo intero, senza distrazioni. */}
      <Route
        path="/scan"
        element={
          <PrivateRoute>
            <ScanCardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/card/:id"
        element={
          <PrivateRoute>
            <CardFullscreenPage />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
