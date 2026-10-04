import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <div style={{ fontWeight: 600, color: "var(--text-muted)" }}>Se încarcă...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (
    allowedRoles
    && !allowedRoles.some((role) => String(user.role).toUpperCase() === role.toUpperCase())
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading" aria-live="polite">
        Se verifică sesiunea...
      </div>
    );
  }

  return children;
}
