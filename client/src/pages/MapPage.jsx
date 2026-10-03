import React, { useState, useEffect } from "react";
import { problemsApi } from "../api/problems.js";
import { categoriesApi } from "../api/categories.js";
import { LeafletMap } from "../components/LeafletMap.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { PriorityBadge } from "../components/PriorityBadge.jsx";
import { Filter, Layers, MapPin, Eye } from "lucide-react";
import { Link } from "react-router-dom";

export function MapPage() {
  const [problems, setProblems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedProblem, setSelectedProblem] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [probsRes, catsRes] = await Promise.allSettled([
          problemsApi.getProblems({
            status: statusFilter || undefined,
            category: categoryFilter || undefined,
            priority: priorityFilter || undefined,
            limit: 100,
          }),
          categoriesApi.getCategories(),
        ]);

        if (probsRes.status === "fulfilled") {
          setProblems(probsRes.value.items || []);
        }
        if (catsRes.status === "fulfilled") {
          setCategories(catsRes.value.categories || []);
        }
      } catch (err) {
        console.error("Map page load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [statusFilter, categoryFilter, priorityFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 70px)" }}>
      {/* Filters Bar */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid var(--border-color)",
          padding: "0.875rem 1.5rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, color: "#0f172a" }}>
          <Filter size={18} style={{ color: "#2563eb" }} /> Filtrează Harta:
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
          <select
            className="form-select"
            style={{ width: "auto", fontSize: "0.85rem" }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Toate Categoriile</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: "auto", fontSize: "0.85rem" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Toate Statusurile</option>
            <option value="NEW">Nouă</option>
            <option value="IN_PROGRESS">În lucru</option>
            <option value="RESOLVED_PENDING_CONFIRMATION">Așteaptă confirmarea</option>
            <option value="RESOLVED">Rezolvată</option>
          </select>

          <select
            className="form-select"
            style={{ width: "auto", fontSize: "0.85rem" }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">Toate Prioritățile</option>
            <option value="CRITICAL">Critică</option>
            <option value="HIGH">Ridicată</option>
            <option value="MEDIUM">Medie</option>
            <option value="LOW">Scăzută</option>
          </select>

          {(statusFilter || categoryFilter || priorityFilter) && (
            <button
              onClick={() => {
                setStatusFilter("");
                setCategoryFilter("");
                setPriorityFilter("");
              }}
              className="btn btn-secondary btn-sm"
            >
              Resetează
            </button>
          )}
        </div>

        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>
          {problems.length} sesizări găsite pe hartă
        </div>
      </div>

      {/* Main Map View */}
      <div style={{ display: "flex", flex: 1, position: "relative" }}>
        <div style={{ flex: 1, height: "calc(100vh - 140px)" }}>
          <LeafletMap
            problems={problems}
            height="100%"
            onMarkerClick={(p) => setSelectedProblem(p)}
          />
        </div>

        {/* Optional Side Details Overlay */}
        {selectedProblem && (
          <div
            className="card animate-fade-in"
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              width: "320px",
              zIndex: 2000,
              padding: "1.25rem",
              boxShadow: "0 20px 30px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontWeight: 700, color: "#2563eb" }}>{selectedProblem.code}</span>
              <button
                onClick={() => setSelectedProblem(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>{selectedProblem.title}</h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.75rem" }}>
              {selectedProblem.address || "Nesemnată"}
            </p>

            <div style={{ display: "flex", gap: "6px", marginBottom: "1rem" }}>
              <StatusBadge status={selectedProblem.status} />
              <PriorityBadge priority={selectedProblem.priority} score={selectedProblem.priorityScore} />
            </div>

            <Link to={`/problems/${selectedProblem.id}`} className="btn btn-primary btn-sm" style={{ width: "100%" }}>
              <Eye size={16} /> Vezi Detalii Completele
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
