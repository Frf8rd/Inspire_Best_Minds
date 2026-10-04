import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { problemsApi } from "../api/problems.js";
import { assetUrl } from "../api/client.js";
import { categoriesApi } from "../api/categories.js";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { PriorityBadge } from "../components/PriorityBadge.jsx";
import {
  Search,
  Filter,
  PlusCircle,
  MapPin,
  ThumbsUp,
  ArrowUpDown,
  Eye,
} from "lucide-react";

export function ProblemsListPage() {
  const [problems, setProblems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt"); // 'createdAt', 'priorityScore', 'supportCount'

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [probsRes, catsRes] = await Promise.allSettled([
          problemsApi.getProblems({
            category: categoryFilter || undefined,
            status: statusFilter || undefined,
            priority: priorityFilter || undefined,
            zone: search.trim() || undefined,
            limit: 50,
          }),
          categoriesApi.getCategories(),
        ]);

        if (probsRes.status === "fulfilled") {
          // Duplicatele sunt grupate sub sesizarea principală, nu se afișează separat.
          let items = (probsRes.value.items || []).filter((p) => !p.duplicateOfId);
          if (search.trim()) {
            const query = search.toLowerCase();
            items = items.filter(
              (p) =>
                p.title.toLowerCase().includes(query) ||
                p.code?.toLowerCase().includes(query) ||
                p.address?.toLowerCase().includes(query)
            );
          }

          // Sorting
          items.sort((a, b) => {
            if (sortBy === "priorityScore") return (b.priorityScore || 0) - (a.priorityScore || 0);
            if (sortBy === "supportCount") return (b.supportCount || 0) - (a.supportCount || 0);
            return new Date(b.createdAt) - new Date(a.createdAt);
          });

          setProblems(items);
        }
        if (catsRes.status === "fulfilled") {
          setCategories(catsRes.value.categories || []);
        }
      } catch (err) {
        console.error("Error loading problems list:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [categoryFilter, statusFilter, priorityFilter, search, sortBy]);

  return (
    <div className="container-custom" style={{ padding: "2.5rem 1.5rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            Sesizări Urbane Comunitare
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Explorează, susține (+1) și urmărește stadiul tuturor tichetelor raportate în oraș.
          </p>
        </div>

        <Link to="/problems/create" className="btn btn-primary">
          <PlusCircle size={18} /> Raportează o Problemă
        </Link>
      </div>

      {/* Filters Bar */}
      <div
        className="card"
        style={{
          padding: "1.25rem",
          marginBottom: "2rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Caută după titlu, cod #UP-xxxx sau adresă..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "2.5rem" }}
          />
          <Search
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

        {/* Dropdown Filters */}
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
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="createdAt">Cele mai recente</option>
            <option value="priorityScore">Scor Prioritate (Max)</option>
            <option value="supportCount">Cele mai susținute (+1)</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "#64748b" }}>
          Se încarcă lista sesizărilor...
        </div>
      ) : problems.length === 0 ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <h3 style={{ marginBottom: "0.5rem" }}>Nu s-au găsit sesizări</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Încearcă să modifici filtrele sau caută alt termen.
          </p>
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
                  <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1rem" }}>
                    <MapPin size={14} style={{ display: "inline", marginRight: "4px" }} />
                    {item.address || "Nesemnată"}
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
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 600, color: "#10b981" }}>
                    <ThumbsUp size={14} /> +{item.supportCount || 0} susțineri
                  </span>
                  <Link to={`/problems/${item.id}`} className="btn btn-secondary btn-sm">
                    <Eye size={14} /> Detalii
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
