import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { useAuth } from "./auth/AuthContext";

export default function App() {
  const { bootstrap, isBootstrapping, user } = useAuth();

  useEffect(() => {
    bootstrap();
  }, []);

  if (isBootstrapping) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={user ? <Dashboard /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}
