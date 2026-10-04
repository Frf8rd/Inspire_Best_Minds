import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/auth.js";
import { useToast } from "../context/ToastContext.jsx";
import { Mail, ArrowLeft } from "lucide-react";

export function ForgotPasswordPage() {
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      addToast("Introdu adresa de email.", "warning");
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
      addToast("Instrucțiunile de resetare au fost trimise pe email.", "success");
    } catch (err) {
      addToast(err.message || "A intervenit o eroare.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
      }}
    >
      <div
        className="card animate-fade-in"
        style={{
          maxWidth: "420px",
          width: "100%",
          padding: "2.5rem 2rem",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.77rem", marginBottom: "0.5rem" }}>Resetare Parolă</h2>
          <p style={{ fontSize: "1.03rem", color: "#64748b" }}>
            Introdu emailul asociat contului tău pentru a primi linkul de resetare.
          </p>
        </div>

        {sent ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <div style={{ color: "#10b981", fontWeight: 700, marginBottom: "1rem" }}>
              Email expediat cu succes!
            </div>
            <p style={{ fontSize: "1.03rem", color: "#64748b", marginBottom: "1.5rem" }}>
              Verifică căsuța poștală a adresei <strong>{email}</strong> pentru instrucțiuni.
            </p>
            <Link to="/login" className="btn btn-secondary btn-sm">
              Înapoi la Autentificare
            </Link>
          </div>
        ) : (
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

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
              {loading ? "Se trimite..." : "Trimite linkul de resetare"}
            </button>
          </form>
        )}

        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <Link to="/login" style={{ fontSize: "1rem", color: "#64748b", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <ArrowLeft size={14} /> Înapoi la Autentificare
          </Link>
        </div>
      </div>
    </div>
  );
}
