import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { UserPlus, Mail, Lock, User, Phone } from "lucide-react";
import { validatePassword } from "../utils/validation.js";

export function RegisterPage() {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      addToast("Numele, emailul și parola sunt obligatorii.", "warning");
      return;
    }
    if (password !== confirmPassword) {
      addToast("Parolele introduse nu coincid.", "warning");
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      addToast(passwordError, "warning");
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password, phone });
      addToast("Contul a fost creat cu succes!", "success");
      navigate("/dashboard");
    } catch (err) {
      addToast(err.message || "Eroare la crearea contului.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "85vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
      }}
    >
      <div
        className="card animate-fade-in"
        style={{
          maxWidth: "480px",
          width: "100%",
          padding: "2.5rem 2rem",
          boxShadow: "0 20px 30px -10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "2.06rem", color: "#0f172a", marginBottom: "0.5rem" }}>
            Creează un cont <span style={{ color: "#2563eb" }}>UrbanAlert</span>
          </h2>
          <p style={{ fontSize: "1.06rem", color: "#64748b" }}>
            Implică-te activ în dezvoltarea orașului tău
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nume complet</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                className="form-input"
                placeholder="Ion Popescu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ paddingLeft: "2.5rem" }}
              />
              <User
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
            <label className="form-label">Adresă de Email</label>
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
            <label className="form-label">Număr de Telefon (opțional)</label>
            <div style={{ position: "relative" }}>
              <input
                type="tel"
                className="form-input"
                placeholder="+373 60 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ paddingLeft: "2.5rem" }}
              />
              <Phone
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
            <label className="form-label">Parolă (min. 6 caractere, cu cel puțin o cifră)</label>
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

          <div className="form-group">
            <label className="form-label">Confirmă parola</label>
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
            <UserPlus size={18} /> {loading ? "Se creează contul..." : "Înregistrează-te"}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "1.03rem", color: "#64748b" }}>
          Ai deja un cont?{" "}
          <Link to="/login" style={{ fontWeight: 700 }}>
            Autentifică-te
          </Link>
        </div>
      </div>
    </div>
  );
}
