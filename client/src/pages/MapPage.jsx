import React, { useState, useEffect, useCallback, useRef } from "react";
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

  // Zona vizibilă a hărții; sesizările se încarcă doar pentru ea.
  const [bounds, setBounds] = useState(null);
  const requestIdRef = useRef(0);

  const handleBoundsChange = useCallback((next) => setBounds(next), []);
  const handleMarkerClick = useCallback((p) => setSelectedProblem(p), []);

  useEffect(() => {
    categoriesApi
      .getCategories()
      .then((res) => setCategories(res.categories || []))
      .catch((err) => console.error("Map categories error:", err));
  }, []);

  useEffect(() => {
    if (!bounds) return; // harta nu și-a raportat încă zona vizibilă
    const requestId = ++requestIdRef.current;

    async function loadData() {
      try {
        const res = await problemsApi.getProblems({
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
          priority: priorityFilter || undefined,
          minLat: bounds.minLat,
          maxLat: bounds.maxLat,
          minLng: bounds.minLng,
          maxLng: bounds.maxLng,
          limit: 100,
        });
        if (requestId !== requestIdRef.current) return; // a venit între timp o cerere mai nouă
        // Duplicatele nu primesc marker propriu; sunt grupate sub sesizarea principală.
        setProblems((res.items || []).filter((p) => !p.duplicateOfId));
      } catch (err) {
        console.error("Map page load error:", err);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }
    loadData();
  }, [bounds, statusFilter, categoryFilter, priorityFilter]);

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
            style={{ width: "auto", fontSize: "1rem" }}
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
            style={{ width: "auto", fontSize: "1rem" }}
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
            style={{ width: "auto", fontSize: "1rem" }}
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

        <div style={{ fontSize: "1rem", fontWeight: 600, color: "#64748b" }}>
          {problems.length} sesizări în zona vizibilă
        </div>
      </div>

      {/* Main Map View */}
      <div style={{ display: "flex", flex: 1, position: "relative" }}>
        <div style={{ flex: 1, height: "calc(100vh - 140px)" }}>
          <LeafletMap
            problems={problems}
            height="100%"
            fitToMarkers={false}
            onBoundsChange={handleBoundsChange}
            onMarkerClick={handleMarkerClick}
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

            <h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>{selectedProblem.title}</h3>
            <p style={{ fontSize: "1rem", color: "#64748b", marginBottom: "0.75rem" }}>
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
