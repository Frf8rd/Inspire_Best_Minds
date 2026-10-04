import React, { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { API_BASE_URL } from "../api/client.js";
import { LogIn, Mail, Lock, Shield, User, Briefcase } from "lucide-react";

// Erorile trimise de backend în URL după un login Google eșuat (?error=...).
const GOOGLE_ERRORS = {
  google_auth_failed: "Autentificarea cu Google a eșuat. Încearcă din nou.",
  google_not_configured: "Autentificarea cu Google nu este configurată pe acest server.",
  account_disabled: "Acest cont a fost dezactivat.",
  server_error: "A apărut o eroare de server. Încearcă din nou mai târziu.",
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.6 17.7 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/>
      <path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.9-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z"/>
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.7-4.1-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/>
    </svg>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const urlError = searchParams.get("error");
  const urlErrorMessage = urlError ? GOOGLE_ERRORS[urlError] || "Autentificarea a eșuat." : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast("Te rugăm să introduci emailul și parola.", "warning");
      return;
    }
    setLoading(true);
    try {
      await login({ email, password });
      addToast("Autentificare reușită!", "success");
      navigate(from, { replace: true });
    } catch (err) {
      addToast(err.message || "Email sau parolă incorectă.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const url = `${API_BASE_URL}/auth/google`;
    setGoogleLoading(true);
    try {
      // Dacă Google nu e configurat, backendul răspunde 503 cu JSON; evităm să afișăm JSON-ul brut.
      const res = await fetch(url, { redirect: "manual", credentials: "include" });
      if (res.status === 503) {
        addToast(GOOGLE_ERRORS.google_not_configured, "error");
        setGoogleLoading(false);
        return;
      }
    } catch {
      // Cererea de verificare a eșuat (CORS/rețea); încercăm oricum navigarea normală.
    }
    window.location.href = url;
  };

  // Demo accounts helper
  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
      }}
    >
      <div
        className="card animate-fade-in"
        style={{
          maxWidth: "440px",
          width: "100%",
          padding: "2.5rem 2rem",
          boxShadow: "0 20px 30px -10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.75rem", color: "#0f172a", marginBottom: "0.5rem" }}>
            Autentificare <span style={{ color: "#2563eb" }}>UrbanPulse</span>
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#64748b" }}>
            Introdu datele de acces pentru a continua
          </p>
        </div>

        {urlErrorMessage && (
          <div
            role="alert"
            style={{
              marginBottom: "1.25rem",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "0.875rem",
            }}
          >
            {urlErrorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                className="form-input"
                placeholder="nume@exemplu.ro"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: "2.5rem" }}
              />
              <Mail
                size={18}
                style={{
                  position: "absolute",
                  left: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">Parolă</label>
              <Link to="/forgot-password" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                Ai uitat parola?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: "2.5rem" }}
              />
              <Lock
                size={18}
                style={{
                  position: "absolute",
                  left: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
            <LogIn size={18} /> {loading ? "Se autentifică..." : "Intră în cont"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.5rem 0 1rem", color: "#94a3b8", fontSize: "0.8rem" }}>
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          sau
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="btn btn-secondary"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          disabled={googleLoading}
        >
          <GoogleIcon /> {googleLoading ? "Se redirecționează..." : "Continuă cu Google"}
        </button>

        {/* Demo Accounts Quick Login */}
        <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "0.75rem", textAlign: "center" }}>
            Acces rapid demo (Hackathon)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
            <button
              onClick={() => fillDemo("citizen@urbanpulse.md", "Test1234")}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "0.75rem", padding: "6px" }}
            >
              <User size={14} /> Cetățean
            </button>
            <button
              onClick={() => fillDemo("staff@urbanpulse.md", "Test1234")}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "0.75rem", padding: "6px" }}
            >
              <Briefcase size={14} /> Staff
            </button>
            <button
              onClick={() => fillDemo("admin@urbanpulse.md", "Test1234")}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "0.75rem", padding: "6px" }}
            >
              <Shield size={14} /> Admin
            </button>
          </div>
        </div>

        <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: "#64748b" }}>
          Nu ai un cont încă?{" "}
          <Link to="/register" style={{ fontWeight: 700 }}>
            Înregistrează-te gratuit
          </Link>
        </div>
      </div>
    </div>
  );
}
