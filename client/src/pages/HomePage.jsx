import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { problemsApi } from "../api/problems.js";
import { assetUrl } from "../api/client.js";
import { analyticsApi } from "../api/analytics.js";
import { LeafletMap } from "../components/LeafletMap.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { PriorityBadge } from "../components/PriorityBadge.jsx";
import {
  PlusCircle,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  MessageSquare,
  ThumbsUp,
} from "lucide-react";

export function HomePage() {
  const [problems, setProblems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [problemsRes, statsRes] = await Promise.allSettled([
          problemsApi.getProblems({ limit: 6 }),
          analyticsApi.getDashboardStats(),
        ]);

        if (problemsRes.status === "fulfilled") {
          setProblems((problemsRes.value.items || []).filter((p) => !p.duplicateOfId));
        }
        if (statsRes.status === "fulfilled") {
          setStats(statsRes.value);
        }
      } catch (err) {
        console.error("Error loading homepage data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#ffffff",
          padding: "4.5rem 0 5rem 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "50%",
            height: "100%",
            background: "radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(0,0,0,0) 70%)",
            pointerEvents: "none",
          }}
        />
        <div className="container-custom" style={{ position: "relative", zIndex: 2 }}>
          <div style={{ maxWidth: "720px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.375rem 0.875rem",
                borderRadius: "9999px",
                background: "rgba(37, 99, 235, 0.2)",
                border: "1px solid rgba(59, 130, 246, 0.4)",
                color: "#60a5fa",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "1.25rem",
              }}
            >
              <ShieldCheck size={16} /> Platformă oficială de sesizări urbane
            </div>

            <h1
              style={{
                fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: "1.25rem",
                color: "#ffffff",
              }}
            >
              Fii vocea orașului tău. <br />
              <span style={{ color: "#38bdf8" }}>Raportează & Transforma Comunitatea.</span>
            </h1>

            <p style={{ fontSize: "1.125rem", color: "#94a3b8", lineHeight: 1.6, marginBottom: "2rem" }}>
              UrbanPulse conectează cetățenii cu instituțiile responsabile în timp real. Raportează gropi, avarii, iluminat deficitar sau deșeuri și urmărește rezolvarea tichetului tău pas cu pas.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              <Link to="/problems/create" className="btn btn-primary btn-lg">
                <PlusCircle size={20} /> Raportează o Problemă
              </Link>
              <Link to="/map" className="btn btn-secondary btn-lg" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
                <MapPin size={20} /> Vezi Harta Sesizărilor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section style={{ transform: "translateY(-30px)", position: "relative", zIndex: 10 }}>
        <div className="container-custom">
          <div
            className="card"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              padding: "1.5rem 2rem",
              gap: "1.5rem",
              background: "#ffffff",
              boxShadow: "0 20px 30px -10px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ padding: "12px", borderRadius: "12px", background: "#eff6ff", color: "#2563eb" }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a" }}>
                  {stats?.statusCounts ? Object.values(stats.statusCounts).reduce((a, b) => a + b, 0) : 0}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Total Sesizări Registrate</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ padding: "12px", borderRadius: "12px", background: "#dcfce7", color: "#166534" }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a" }}>
                  {(stats?.statusCounts?.RESOLVED || 0) + (stats?.statusCounts?.RESOLVED_PENDING_CONFIRMATION || 0)}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Probleme Rezolvate</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ padding: "12px", borderRadius: "12px", background: "#fef9c3", color: "#854d0e" }}>
                <Clock size={24} />
              </div>
              <div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a" }}>
                  {stats?.avgResponseTimeHours !== undefined ? `${stats.avgResponseTimeHours}h` : "< 24h"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Timp Mediu de Răspuns</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Preview Section */}
      <section style={{ padding: "2.5rem 0" }}>
        <div className="container-custom">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.8rem" }}>Harta Live a Sesizărilor</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                Vizualizează incidențele din oraș în timp real pe hartă interactivă.
              </p>
            </div>
            <Link to="/map" className="btn btn-outline btn-sm">
              Extinde Harta Complete <ArrowRight size={16} />
            </Link>
          </div>

          <div className="card" style={{ padding: "0.5rem" }}>
            <LeafletMap problems={problems} height="420px" />
          </div>
        </div>
      </section>

      {/* Recent Problems Grid */}
      <section style={{ padding: "3rem 0", backgroundColor: "#f8fafc" }}>
        <div className="container-custom">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.75rem" }}>
            <div>
              <h2 style={{ fontSize: "1.8rem" }}>Ultimele Probleme Raportate</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                Comunitatea se implică activ. Susține sesizările existente prin butonul +1.
              </p>
            </div>
            <Link to="/problems" className="btn btn-secondary btn-sm">
              Vezi toate tichetele <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "#64748b" }}>Se încarcă tichetele...</div>
          ) : problems.length === 0 ? (
            <div className="card" style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
              Nu există sesizări înregistrate deocamdată. Fii primul care raportează!
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {problems.map((item) => (
                <div key={item.id} className="card card-hover" style={{ display: "flex", flexDirection: "column" }}>
                  {/* Photo or Placeholder */}
                  <div style={{ height: "180px", backgroundColor: "#e2e8f0", position: "relative", overflow: "hidden" }}>
                    {item.photos && item.photos.length > 0 ? (
                      <img
                        src={assetUrl(item.photos[0].publicPath)}
                        alt={item.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#94a3b8",
                          fontWeight: 600,
                        }}
                      >
                        Fără fotografie
                      </div>
                    )}
                    <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", gap: "6px" }}>
                      <StatusBadge status={item.status} />
                      <PriorityBadge priority={item.priority} score={item.priorityScore} />
                    </div>
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2563eb", marginBottom: "4px" }}>
                        {item.code}
                      </div>
                      <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem", lineHeight: 1.3 }}>
                        <Link to={`/problems/${item.id}`} style={{ color: "#0f172a" }}>
                          {item.title}
                        </Link>
                      </h3>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#64748b",
                          marginBottom: "1rem",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.description || "Fără descriere."}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: "0.75rem",
                        borderTop: "1px solid #f1f5f9",
                        fontSize: "0.8rem",
                        color: "#64748b",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 600, color: "#10b981" }}>
                        <ThumbsUp size={14} /> +{item.supportCount || 0} susțineri
                      </span>
                      <span>{new Date(item.createdAt).toLocaleDateString("ro-RO")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
