import { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import MyTierListsPage from "./components/MyTierListsPage";
import TierListViewPage from "./components/TierListViewPage";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import NavBar from "./components/NavBar";
import { RequireAuth } from "./auth/RequireAuth";
import { api } from "./lib/axios";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check session on app load
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/whoami");
        if (res.data?.userId) setIsLoggedIn(true);
      } catch {
        // No active session
      } finally {
        setCheckingSession(false);
      }
    })();
  }, []);

  if (checkingSession) return <div>Loading session...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      {isLoggedIn && <NavBar />}

      <Routes>
        {/* Redirect root based on login status */}
        <Route
          path="/"
          element={<Navigate to={isLoggedIn ? "/my-tierlists" : "/login"} replace />}
        />

        {/* Public routes */}
        <Route
          path="/login"
          element={<LoginForm onLogin={() => setIsLoggedIn(true)} />}
        />
        <Route path="/register" element={<RegisterForm />} />

        {/* Protected routes */}
        <Route
          path="/my-tierlists"
          element={
            <RequireAuth isLoggedIn={isLoggedIn}>
              <MyTierListsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/tierlist/:id"
          element={
            <RequireAuth isLoggedIn={isLoggedIn}>
              <TierListViewPage />
            </RequireAuth>
          }
        />
      </Routes>
    </div>
  );
}
