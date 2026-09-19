import { Navigate, Route, Routes } from "react-router-dom";
import CardFullscreenPage from "./pages/CardFullscreenPage";
import CardListPage from "./pages/CardListPage";
import LoginPage from "./pages/LoginPage";
import ScanCardPage from "./pages/ScanCardPage";

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
      <Route
        path="/"
        element={
          <PrivateRoute>
            <CardListPage />
          </PrivateRoute>
        }
      />
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
