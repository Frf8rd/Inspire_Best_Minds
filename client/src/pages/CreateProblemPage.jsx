import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { problemsApi } from "../api/problems.js";
import { categoriesApi } from "../api/categories.js";
import { useToast } from "../context/ToastContext.jsx";
import { LeafletMap } from "../components/LeafletMap.jsx";
import {
  MapPin,
  Upload,
  PlusCircle,
  X,
  AlertTriangle,
  Navigation,
  CheckCircle2,
} from "lucide-react";

export function CreateProblemPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(47.0245);
  const [longitude, setLongitude] = useState(28.8322);

  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await categoriesApi.getCategories();
        setCategories(res.categories || []);
        if (res.categories?.length > 0) {
          setCategoryId(res.categories[0].id);
        }
      } catch (err) {
        addToast("Nu s-au putut încărca categoriile.", "error");
      }
    }
    loadCategories();
  }, []);

  // Handle Photo selection with pre-validation
  const handlePhotosChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const newPreviews = [...previews];

    if (photos.length + files.length > 5) {
      addToast("Poți încărca maxim 5 fotografii.", "warning");
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        addToast(`Fișierul ${file.name} depășește limita de 5MB.`, "warning");
        continue;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        addToast(`Formatul fișierului ${file.name} nu este acceptat (doar JPEG, PNG, WebP).`, "warning");
        continue;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setPhotos((prev) => [...prev, ...validFiles]);
    setPreviews(newPreviews);
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Browser Geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      addToast("Geolocația nu este suportată de browserul tău.", "warning");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        addToast("Locația a fost preluată cu succes!", "success");
      },
      () => {
        addToast("Nu am putut accesa locația curentă.", "error");
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || title.length < 3) {
      addToast("Titlul este obligatoriu (minim 3 caractere).", "warning");
      return;
    }
    if (!categoryId) {
      addToast("Selectează o categorie.", "warning");
      return;
    }

    setLoading(true);
    setDuplicateInfo(null);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("categoryId", categoryId);
    formData.append("address", address.trim());
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);

    photos.forEach((photo) => {
      formData.append("photos", photo);
    });

    try {
      const res = await problemsApi.createProblem(formData);

      if (res.duplicate) {
        setDuplicateInfo(res);
        addToast("Această problemă a fost identificată ca duplicat și s-a înregistrat susținerea ta (+1)!", "info");
      } else {
        addToast(`Sesizarea ${res.problem.code} a fost creată cu succes!`, "success");
        if (res.ai?.verdict === "FLAGGED") {
          addToast(`Verificarea automată a marcat sesizarea pentru revizuire: ${res.ai.reasons.join(" ")}`, "warning");
        }
        navigate(`/problems/${res.problem.id}`);
      }
    } catch (err) {
      addToast(err.message || "Eroare la transmiterea sesizării.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-custom" style={{ padding: "2.5rem 1.5rem" }}>
      <div style={{ maxWidth: "840px", margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            Raportează o Problemă Urbană
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Completează datele problemei pentru ca echipa să poată interveni în cel mai scurt timp.
          </p>
        </div>

        {/* Duplicate Alert Card if triggered */}
        {duplicateInfo && (
          <div
            className="card animate-fade-in"
            style={{
              padding: "1.5rem",
              marginBottom: "2rem",
              backgroundColor: "#eff6ff",
              borderColor: "#93c5fd",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#1d4ed8", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>
              <AlertTriangle size={24} />
              Această problemă a fost deja raportată!
            </div>
            <p style={{ color: "#1e40af", fontSize: "0.9rem", marginBottom: "1rem" }}>
              Am detectat o sesizare similară în apropiere ({duplicateInfo.parentCode}). Am adăugat automat susținerea ta (+1) la problema existentă pentru a-i crește prioritatea.
            </p>
            <button
              onClick={() => navigate(`/problems/${duplicateInfo.problem.duplicateOfId || duplicateInfo.problem.id}`)}
              className="btn btn-primary btn-sm"
            >
              <CheckCircle2 size={16} /> Vezi problema existentă ({duplicateInfo.parentCode})
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card" style={{ padding: "2rem" }}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Titlu Sesizare *</label>
            <input
              type="text"
              className="form-input"
              placeholder="ex: Groapă adâncă pe carosabil, Avarie iluminat public..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Categorie Problemă *</label>
            <select
              className="form-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Descriere Detaliată</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Descrie problema, reperele vizuale sau pericolul creat..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Photos Upload */}
          <div className="form-group">
            <label className="form-label">Fotografii (max. 5 imagini, max. 5MB fiecare)</label>

            <div
              style={{
                border: "2px dashed var(--border-color)",
                borderRadius: "12px",
                padding: "1.5rem",
                textAlign: "center",
                backgroundColor: "#f8fafc",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotosChange}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer",
                }}
              />
              <Upload size={32} style={{ color: "#2563eb", marginBottom: "0.5rem" }} />
              <div style={{ fontWeight: 600, color: "#334155" }}>
                Apasă sau trage fișierele foto aici
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                Formate suportate: JPEG, PNG, WebP
              </div>
            </div>

            {/* Photo Previews Grid */}
            {previews.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1rem" }}>
                {previews.map((src, i) => (
                  <div
                    key={i}
                    style={{
                      position: "relative",
                      width: "80px",
                      height: "80px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <img src={src} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        background: "rgba(239, 68, 68, 0.9)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Address & Location */}
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label className="form-label" style={{ margin: 0 }}>Locație pe Hartă *</label>
              <button
                type="button"
                onClick={handleUseMyLocation}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: "0.75rem" }}
              >
                <Navigation size={14} /> Folosește locația mea GPS
              </button>
            </div>

            <input
              type="text"
              className="form-input"
              placeholder="Adresă sau punct de reper (ex: Str. Ștefan cel Mare nr. 10)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ marginBottom: "1rem" }}
            />

            <div style={{ height: "300px", borderRadius: "12px", overflow: "hidden" }}>
              <LeafletMap
                selectable
                selectedPosition={{ latitude, longitude }}
                onPositionSelect={({ latitude: lat, longitude: lng }) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                height="100%"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%", marginTop: "1.5rem" }}
            disabled={loading}
          >
            <PlusCircle size={20} /> {loading ? "Se validează și transmite..." : "Trimite Sesizarea"}
          </button>
        </form>
      </div>
    </div>
  );
}