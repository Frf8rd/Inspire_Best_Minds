import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { problemsApi } from "../api/problems.js";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { PriorityBadge } from "../components/PriorityBadge.jsx";
import {
  PlusCircle,
  Layers,
  CheckCircle2,
  Clock,
  Bell,
  ArrowRight,
  Eye,
  AlertCircle,
} from "lucide-react";

export function CitizenDashboardPage() {
  const { user, unreadCount } = useAuth();
  const [myProblems, setMyProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await problemsApi.getMyProblems();
        setMyProblems(res.items || []);
      } catch (err) {
        console.error("Error loading user dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalMy = myProblems.length;
  const activeCount = myProblems.filter((p) => !["RESOLVED", "REJECTED", "DUPLICATE"].includes(p.status)).length;
  const resolvedCount = myProblems.filter((p) => p.status === "RESOLVED" || p.status === "RESOLVED_PENDING_CONFIRMATION").length;
  const inReviewCount = myProblems.filter((p) => p.status === "NEW" || p.status === "IN_REVIEW").length;

  return (
    <div className="container-custom" style={{ padding: "2rem 1.5rem" }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          padding: "2rem",
          marginBottom: "2rem",
          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
          color: "#ffffff",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2.12rem", color: "#ffffff", marginBottom: "0.5rem" }}>
            Salut, {user?.name || "Cetățean"}! 👋
          </h1>
          <p style={{ color: "#bfdbfe", fontSize: "1.12rem", maxWidth: "600px" }}>
            Bine ai venit în panoul tău cetățenesc UrbanPulse. Urmărește stadiul sesizărilor tale și implică-te în rezolvarea problemelor urbane.
          </p>
        </div>

        <Link to="/problems/create" className="btn btn-lg" style={{ background: "#ffffff", color: "#2563eb" }}>
          <PlusCircle size={22} /> Raportează o problemă
        </Link>
      </div>

      {/* Counter Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2.5rem",
        }}
      >
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ padding: "10px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb" }}>
              <Layers size={22} />
            </div>
            <div>
              <div style={{ fontSize: "1.77rem", fontWeight: 800 }}>{totalMy}</div>
              <div style={{ fontSize: "0.94rem", color: "#64748b" }}>Sesizările mele</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ padding: "10px", borderRadius: "10px", background: "#fef9c3", color: "#ca8a04" }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: "1.77rem", fontWeight: 800 }}>{activeCount}</div>
              <div style={{ fontSize: "0.94rem", color: "#64748b" }}>Probleme active</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ padding: "10px", borderRadius: "10px", background: "#dcfce7", color: "#166534" }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: "1.77rem", fontWeight: 800 }}>{resolvedCount}</div>
              <div style={{ fontSize: "0.94rem", color: "#64748b" }}>Rezolvate</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ padding: "10px", borderRadius: "10px", background: "#f3e8ff", color: "#7c3aed" }}>
              <AlertCircle size={22} />
            </div>
            <div>
              <div style={{ fontSize: "1.77rem", fontWeight: 800 }}>{inReviewCount}</div>
              <div style={{ fontSize: "0.94rem", color: "#64748b" }}>În verificare</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ padding: "10px", borderRadius: "10px", background: "#fee2e2", color: "#dc2626" }}>
              <Bell size={22} />
            </div>
            <div>
              <div style={{ fontSize: "1.77rem", fontWeight: 800 }}>{unreadCount}</div>
              <div style={{ fontSize: "0.94rem", color: "#64748b" }}>Notificări noi</div>
            </div>
          </div>
        </div>
      </div>

      {/* My Problems List */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
            paddingBottom: "0.75rem",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <h2 style={{ fontSize: "1.47rem" }}>Ultimele Sesizări Transmise</h2>
          <Link to="/my-problems" className="btn btn-secondary btn-sm">
            Vezi toate ({totalMy}) <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Se încarcă...</div>
        ) : myProblems.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <p style={{ color: "#64748b", marginBottom: "1rem" }}>Nu ai transmis nicio sesizare până acum.</p>
            <Link to="/problems/create" className="btn btn-primary btn-sm">
              <PlusCircle size={16} /> Raportează prima ta problemă
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
                  <th>Data</th>
                  <th>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {myProblems.slice(0, 5).map((item) => (
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
                    <td style={{ color: "#64748b" }}>
                      {new Date(item.createdAt).toLocaleDateString("ro-RO")}
                    </td>
                    <td>
                      <Link to={`/problems/${item.id}`} className="btn btn-secondary btn-sm">
                        <Eye size={14} /> Vezi
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
