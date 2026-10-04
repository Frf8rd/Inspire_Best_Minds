import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#0f172a",
        color: "#94a3b8",
        padding: "3rem 0 2rem 0",
        marginTop: "4rem",
        borderTop: "1px solid #1e293b",
      }}
    >
      <div className="container-custom">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "2.5rem",
            marginBottom: "2.5rem",
          }}
        >
          {/* Brand Col */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "#ffffff",
                fontSize: "1.47rem",
                fontWeight: 800,
                marginBottom: "0.75rem",
              }}
            >
              <MapPin size={22} style={{ color: "#2563eb" }} />
              Urban<span style={{ color: "#38bdf8" }}>Pulse</span>
            </div>
            <p style={{ fontSize: "1.03rem", lineHeight: "1.6" }}>
              Platformă digitală modernă pentru sesizări urbane, implicare cetățenească și transparență instituțională.
            </p>
          </div>

          {/* Navigation Col */}
          <div>
            <h4 style={{ color: "#ffffff", fontSize: "1.12rem", marginBottom: "1rem" }}>Aplicație</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "1.03rem" }}>
              <Link to="/map" style={{ color: "#94a3b8" }}>Hartă Interactivă</Link>
              <Link to="/problems" style={{ color: "#94a3b8" }}>Toate Sesizările</Link>
              <Link to="/problems/create" style={{ color: "#94a3b8" }}>Raportează o Problemă</Link>
              <Link to="/dashboard" style={{ color: "#94a3b8" }}>Dashboard Cetățean</Link>
            </div>
          </div>

          {/* Transparency Col */}
          <div>
            <h4 style={{ color: "#ffffff", fontSize: "1.12rem", marginBottom: "1rem" }}>Transparență</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "1.03rem" }}>
              <Link to="/analytics/transparency/primaria-chisinau" style={{ color: "#94a3b8" }}>Raport Transparență Primărie</Link>
              <span style={{ fontSize: "0.94rem", color: "#64748b" }}>Auditat automat în timp real</span>
            </div>
          </div>

          {/* Hackathon BEST Minds info */}
          <div>
            <h4 style={{ color: "#ffffff", fontSize: "1.12rem", marginBottom: "1rem" }}>BEST Minds Hackathon</h4>
            <p style={{ fontSize: "1rem", lineHeight: "1.5" }}>
              Construit cu pasiuni pentru o administrație publică eficientă, deschisă și axată pe cetățean.
            </p>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid #1e293b",
            paddingTop: "1.5rem",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            fontSize: "0.94rem",
          }}
        >
          <div>© {new Date().getFullYear()} UrbanPulse (Inspire Best Minds). Toate drepturile rezervate.</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            Dezvoltat cu <Heart size={14} style={{ color: "#ef4444" }} /> pentru orașe inteligente.
          </div>
        </div>
      </div>
    </footer>
  );
}
