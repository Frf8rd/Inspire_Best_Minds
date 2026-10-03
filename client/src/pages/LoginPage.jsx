import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { LogIn, Mail, Lock, Shield, User, Briefcase } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
