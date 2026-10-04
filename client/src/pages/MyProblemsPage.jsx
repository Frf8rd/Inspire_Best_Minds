import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { problemsApi } from "../api/problems.js";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { PriorityBadge } from "../components/PriorityBadge.jsx";
import { PlusCircle, Eye, Layers } from "lucide-react";

export function MyProblemsPage() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await problemsApi.getMyProblems();
        setProblems(res.items || []);
      } catch (err) {
        console.error("Error loading my problems:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="container-custom" style={{ padding: "2.5rem 1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            Sesizările Mele
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Lista tuturor problemelor raportate direct de contul tău.
          </p>
        </div>

        <Link to="/problems/create" className="btn btn-primary">
          <PlusCircle size={18} /> Raportează o Problemă
        </Link>
      </div>

      <div className="card" style={{ padding: "1.5rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>Se încarcă...</div>
        ) : problems.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <p style={{ color: "#64748b", marginBottom: "1rem" }}>Nu ai transmis nicio sesizare până acum.</p>
            <Link to="/problems/create" className="btn btn-primary btn-sm">
              <PlusCircle size={16} /> Adaugă o sesizare nouă
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Cod</th>
                  <th>Titlu</th>
                  <th>Categorie</th>
                  <th>Status</th>
                  <th>Prioritate</th>
                  <th>Susțineri (+1)</th>
                  <th>Data</th>
                  <th>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 700, color: "#2563eb" }}>{item.code}</td>
                    <td style={{ fontWeight: 600 }}>{item.title}</td>
                    <td>{item.category?.name || "Necunoscută"}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <PriorityBadge priority={item.priority} score={item.priorityScore} />
                    </td>
                    <td style={{ fontWeight: 700, color: "#10b981" }}>+{item.supportCount || 0}</td>
                    <td style={{ color: "#64748b" }}>
                      {new Date(item.createdAt).toLocaleDateString("ro-RO")}
                    </td>
                    <td>
                      <Link to={`/problems/${item.id}`} className="btn btn-secondary btn-sm">
                        <Eye size={14} /> Detalii
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
