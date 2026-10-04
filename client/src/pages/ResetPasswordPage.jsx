import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth.js";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { validatePassword } from "../utils/validation.js";
import { Lock, ArrowLeft } from "lucide-react";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      addToast("Tokenul de resetare lipsește din URL.", "error");
      return;
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      addToast(passwordError, "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast("Parolele nu coincid.", "warning");
      return;
    }

    setLoading(true);
    try {
      // Backendul cere { token, password } și autentifică userul după resetare.
      await authApi.resetPassword({ token, password: newPassword });
      await refreshUser();
      addToast("Parola a fost resetată cu succes! Ești autentificat.", "success");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      addToast(err.message || "Token invalid sau expirat.", "error");
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
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Setare Parolă Nouă</h2>
          <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
            Introdu nouă parolă pentru contul tău.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Parolă nouă</label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

          <div className="form-group">
            <label className="form-label">Confirmă parola nouă</label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Se salvează..." : "Resetează parola"}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <Link to="/login" style={{ fontSize: "0.85rem", color: "#64748b", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <ArrowLeft size={14} /> Înapoi la Autentificare
          </Link>
        </div>
      </div>
    </div>
  );
}
