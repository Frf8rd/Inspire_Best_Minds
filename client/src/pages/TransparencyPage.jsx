import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { analyticsApi } from "../api/analytics.js";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { Building, ShieldCheck, CheckCircle2, Clock, Star, Award } from "lucide-react";

export function TransparencyPage() {
  const { idOrSlug } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await analyticsApi.getTransparencyReport(idOrSlug || "primaria-chisinau");
        setReport(res);
      } catch (err) {
        console.error("Transparency load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [idOrSlug]);

  if (loading) {
    return <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>Se generează raportul de transparență...</div>;
  }

  if (!report) {
    return <div className="container-custom" style={{ padding: "4rem", textAlign: "center" }}>Raportul nu a fost găsit.</div>;
  }

  return (
    <div className="container-custom" style={{ padding: "2.5rem 1.5rem" }}>
      <div
        className="card"
        style={{
          padding: "2rem",
          marginBottom: "2rem",
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "4px 12px", borderRadius: "20px", background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", fontSize: "0.8rem", fontWeight: 600, marginBottom: "1rem" }}>
          <ShieldCheck size={16} /> Auditat Public Automat
        </div>
        <h1 style={{ fontSize: "2.2rem", color: "#ffffff", marginBottom: "0.5rem" }}>
          Raport de Transparență: {report.institution?.name}
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>
          Indicatori de performanță, timp mediu de răspuns și rata de soluționare calculată în mod transparent din datele platformei.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#eab308" }}>{report.reputationRating} / 5.0</div>
          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Scor Reputație Instituțională</div>
        </div>

        <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#10b981" }}>{report.resolutionRate}%</div>
          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Rată de Soluționare</div>
        </div>

        <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#2563eb" }}>{report.avgResponseTimeHours}h</div>
          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Timp Mediu de Preluare</div>
        </div>

        <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#8b5cf6" }}>{report.avgResolutionTimeDays} zile</div>
          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Timp Mediu de Remedieri</div>
        </div>
      </div>
    </div>
  );
}
