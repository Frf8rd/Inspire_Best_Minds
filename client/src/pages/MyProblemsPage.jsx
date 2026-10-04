import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { problemsApi } from "../api/problems.js";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { PriorityBadge } from "../components/PriorityBadge.jsx";
import { PlusCircle, Eye, Layers, ClipboardList, CircleCheck, Clock3 } from "lucide-react";

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

  const resolvedCount = problems.filter((item) =>
    ["RESOLVED", "RESOLVED_PENDING_CONFIRMATION"].includes(item.status),
  ).length;
  const activeCount = problems.filter((item) =>
    !["RESOLVED", "RESOLVED_PENDING_CONFIRMATION", "REJECTED", "DUPLICATE"].includes(item.status),
  ).length;

  return (
    <div className="container-custom my-problems-page">
      <header className="my-problems-hero">
        <div className="my-problems-title">
          <span className="my-problems-icon"><Layers size={22} /></span>
          <div>
            <span className="my-problems-eyebrow">Spațiul tău UrbanPulse</span>
            <h1>Sesizările mele</h1>
          </div>
        </div>
        <Link to="/problems/create" className="btn btn-primary my-problems-create">
          <PlusCircle size={18} /> Raportează o problemă
        </Link>
      </header>

      <section className="my-problems-stats" aria-label="Rezumatul sesizărilor">
        <article className="my-problems-stat">
          <span className="my-problems-stat-icon"><ClipboardList size={19} /></span>
          <div><span>Total sesizări</span><strong>{problems.length}</strong></div>
        </article>
        <article className="my-problems-stat my-problems-stat-active">
          <span className="my-problems-stat-icon"><Clock3 size={19} /></span>
          <div><span>În desfășurare</span><strong>{activeCount}</strong></div>
        </article>
        <article className="my-problems-stat my-problems-stat-resolved">
          <span className="my-problems-stat-icon"><CircleCheck size={19} /></span>
          <div><span>Rezolvate</span><strong>{resolvedCount}</strong></div>
        </article>
      </section>

      <section className="card my-problems-card">
        <div className="my-problems-card-heading">
          <div>
            <h2>Istoricul sesizărilor</h2>
            <p>Detalii și status pentru fiecare problemă raportată</p>
          </div>
          <span className="my-problems-count">{problems.length} {problems.length === 1 ? "sesizare" : "sesizări"}</span>
        </div>
        {loading ? (
          <div className="my-problems-state">Se încarcă sesizările...</div>
        ) : problems.length === 0 ? (
          <div className="my-problems-empty">
            <span className="my-problems-empty-icon"><ClipboardList size={28} /></span>
            <h3>Încă nu ai raportat nicio problemă</h3>
            <p>Trimite prima sesizare și urmărește aici actualizările comunității.</p>
            <Link to="/problems/create" className="btn btn-primary">
              <PlusCircle size={17} /> Adaugă o sesizare
            </Link>
          </div>
        ) : (
          <div className="my-problems-table-wrap">
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
                    <td className="my-problems-code">{item.code}</td>
                    <td className="my-problems-name">{item.title}</td>
                    <td>{item.category?.name || "Necunoscută"}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <PriorityBadge priority={item.priority} score={item.priorityScore} />
                    </td>
                    <td className="my-problems-support">+{item.supportCount || 0}</td>
                    <td className="my-problems-date">
                      {new Date(item.createdAt).toLocaleDateString("ro-RO")}
                    </td>
                    <td>
                      <Link to={`/problems/${item.id}`} className="btn btn-secondary btn-sm my-problems-details">
                        <Eye size={15} /> Vezi detalii
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
