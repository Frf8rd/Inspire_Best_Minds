import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { authApi } from "../api/auth.js";
import { User, Mail, Phone, Lock, Save, Shield } from "lucide-react";
import { validatePassword } from "../utils/validation.js";

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast("Numele este obligatoriu.", "warning");
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() });
      addToast("Profilul a fost actualizat cu succes!", "success");
    } catch (err) {
      addToast(err.message || "Eroare la salvarea profilului.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      addToast("Toate câmpurile pentru parolă sunt obligatorii.", "warning");
      return;
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      addToast(passwordError, "warning");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      addToast("Parolele noi nu coincid.", "warning");
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      addToast("Parola a fost modificată cu succes!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      addToast(err.message || "Parola curentă este incorectă.", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="container-custom" style={{ padding: "2.5rem 1.5rem" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
          Setări Profil
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "2rem" }}>
          Administrează informațiile personale și securitatea contului tău.
        </p>

        {/* Profile Card */}
        <form onSubmit={handleUpdateProfile} className="card" style={{ padding: "1.75rem", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <User size={20} style={{ color: "#2563eb" }} /> Date Personale
          </h2>

          <div className="form-group">
            <label className="form-label">Rol în sistem</label>
            <div>
              <span className="badge" style={{ backgroundColor: "#e0e7ff", color: "#3730a3" }}>
                <Shield size={12} /> {user?.role}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Adresă de Email</label>
            <input type="email" className="form-input" value={user?.email || ""} disabled style={{ backgroundColor: "#f8fafc" }} />
          </div>

          <div className="form-group">
            <label className="form-label">Nume complet</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Număr de Telefon</label>
            <input
              type="tel"
              className="form-input"
              placeholder="+373 60 000 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={savingProfile}>
            <Save size={18} /> {savingProfile ? "Se salvează..." : "Salvează Modificările"}
          </button>
        </form>

        {/* Change Password Card */}
        <form onSubmit={handleChangePassword} className="card" style={{ padding: "1.75rem" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Lock size={20} style={{ color: "#2563eb" }} /> Schimbare Parolă
          </h2>

          <div className="form-group">
            <label className="form-label">Parola Curentă</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Parola Nouă (min. 6 caractere, cu cel puțin o cifră)</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirmă Parola Nouă</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-secondary" disabled={savingPassword}>
            <Lock size={18} /> {savingPassword ? "Se actualizează..." : "Schimbă Parola"}
          </button>
        </form>
      </div>
    </div>
  );
}
