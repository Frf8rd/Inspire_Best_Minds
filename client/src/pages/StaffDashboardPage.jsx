import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { problemsApi } from "../api/problems.js";
import { complaintsApi } from "../api/complaints.js";
import { analyticsApi } from "../api/analytics.js";
import { useToast } from "../context/ToastContext.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { PriorityBadge } from "../components/PriorityBadge.jsx";
import { Modal } from "../components/Modal.jsx";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
  Send,
  FileText,
  Filter,
} from "lucide-react";

export function StaffDashboardPage() {
  const { addToast } = useToast();

  const [tab, setTab] = useState("problems"); // 'problems' | 'complaints'
  const [problems, setProblems] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Status Modal
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [targetStatus, setTargetStatus] = useState("IN_PROGRESS");
  const [statusComment, setStatusComment] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Answer Complaint Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const [showAnswerModal, setShowAnswerModal] = useState(false);

  const loadStaffData = async () => {
    setLoading(true);
    try {
      const [probsRes, compRes, statsRes] = await Promise.allSettled([
        problemsApi.getProblems({
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          limit: 50,
        }),
        complaintsApi.getComplaints(),
        analyticsApi.getDashboardStats(),
      ]);

      if (probsRes.status === "fulfilled") {
        setProblems(probsRes.value.items || []);
      }
      if (compRes.status === "fulfilled") {
        setComplaints(compRes.value.complaints || []);
      }
      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value);
      }
    } catch (err) {
      console.error("Staff dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, [statusFilter, priorityFilter]);

  const handleUpdateStatus = async () => {
    if (!selectedProblem) return;
    try {
      await problemsApi.updateStatus(selectedProblem.id, {
        toStatus: targetStatus,
        comment: statusComment,
      });
      addToast(`Statusul sesizării ${selectedProblem.code} a fost actualizat!`, "success");
      setShowStatusModal(false);
      setStatusComment("");
      loadStaffData();
    } catch (err) {
      addToast(err.message || "Eroare la Schimbarea statusului.", "error");
    }
  };

  const handleAnswerComplaint = async () => {
    if (!selectedComplaint) return;
    if (!answerText.trim() || answerText.trim().length < 5) {
      addToast("Răspunsul oficial trebuie să aibă cel puțin 5 caractere.", "warning");
      return;
    }
    try {
      await complaintsApi.answerComplaint(selectedComplaint.id, answerText.trim());
      addToast("Răspunsul oficial a fost înregistrat și expediat!", "success");
      setShowAnswerModal(false);
      setAnswerText("");
      loadStaffData();
    } catch (err) {
      addToast(err.message || "Eroare la înregistrarea răspunsului.", "error");
    }
  };

  return (
    <div className="container-custom" style={{ padding: "2.5rem 1.5rem" }}>
      {/* Page Title */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Briefcase size={28} style={{ color: "#2563eb" }} /> Panou de Gestiune Staff & Instituții
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Evaluează tichetele departamentului, schimbă statusul și înregistrează răspunsuri oficiale la reclamații.
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Tichete Noi (Unassigned)</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#2563eb", marginTop: "4px" }}>
            {stats?.statusCounts?.NEW || 0}
          </div>
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>În Lucru / Progres</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ca8a04", marginTop: "4px" }}>
            {stats?.statusCounts?.IN_PROGRESS || 0}
          </div>
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Așteaptă Confirmare</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ea580c", marginTop: "4px" }}>
            {stats?.statusCounts?.RESOLVED_PENDING_CONFIRMATION || 0}
          </div>
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Sesizări Formale Activa</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#dc2626", marginTop: "4px" }}>
            {complaints.filter((c) => c.status === "SENT" || c.status === "ACKNOWLEDGED").length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
        <button
          onClick={() => setTab("problems")}
          className={`btn btn-sm ${tab === "problems" ? "btn-primary" : "btn-secondary"}`}
        >
          Sesizări Departament ({problems.length})
        </button>
        <button
          onClick={() => setTab("complaints")}
          className={`btn btn-sm ${tab === "complaints" ? "btn-primary" : "btn-secondary"}`}
        >
          <FileText size={16} /> Reclamații Formale ({complaints.length})
        </button>
      </div>

      {/* Tab 1: Problems List */}
      {tab === "problems" && (
        <div className="card" style={{ padding: "1.5rem" }}>
          {/* Filter Bar */}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, fontSize: "0.85rem", color: "#64748b" }}>
              <Filter size={16} /> Filtre:
            </div>
            <select className="form-select" style={{ width: "auto", fontSize: "0.85rem" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Toate Statusurile</option>
              <option value="NEW">Nouă</option>
              <option value="IN_REVIEW">În verificare</option>
              <option value="CONFIRMED">Confirmată</option>
              <option value="ASSIGNED">Repartizată</option>
              <option value="IN_PROGRESS">În lucru</option>
              <option value="RESOLVED_PENDING_CONFIRMATION">Așteaptă confirmarea</option>
              <option value="RESOLVED">Rezolvată</option>
              <option value="REOPENED">Redeschisă</option>
            </select>

            <select className="form-select" style={{ width: "auto", fontSize: "0.85rem" }} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">Toate Prioritățile</option>
              <option value="CRITICAL">Critică</option>
              <option value="HIGH">Ridicată</option>
              <option value="MEDIUM">Medie</option>
              <option value="LOW">Scăzută</option>
            </select>
          </div>

          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Se încarcă...</div>
          ) : problems.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
              Nu există tichete pe filtrele selectate.
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
                    <th>Susțineri</th>
                    <th>Data</th>
                    <th>Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700, color: "#2563eb" }}>{item.code}</td>
                      <td style={{ fontWeight: 600 }}>{item.title}</td>
                      <td>{item.category?.name || "Nespecificată"}</td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>
                        <PriorityBadge priority={item.priority} score={item.priorityScore} />
                      </td>
                      <td style={{ fontWeight: 700, color: "#10b981" }}>+{item.supportCount || 0}</td>
                      <td style={{ color: "#64748b" }}>{new Date(item.createdAt).toLocaleDateString("ro-RO")}</td>
                      <td>
                        <div style={{ display: "flex", gap: "0.375rem" }}>
                          <Link to={`/problems/${item.id}`} className="btn btn-secondary btn-sm">
                            <Eye size={14} /> Vezi
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedProblem(item);
                              setShowStatusModal(true);
                            }}
                            className="btn btn-primary btn-sm"
                          >
                            <Edit size={14} /> Status
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Formal Complaints List */}
      {tab === "complaints" && (
        <div className="card" style={{ padding: "1.5rem" }}>
          {complaints.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
              Nu există nicio reclamație formală înregistrată.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nr. Referință</th>
                    <th>Problema</th>
                    <th>Instituție</th>
                    <th>Canal</th>
                    <th>Status</th>
                    <th>Termen Răspuns (dueAt)</th>
                    <th>Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700, color: "#dc2626" }}>{c.referenceNumber}</td>
                      <td>
                        <Link to={`/problems/${c.reportId}`} style={{ fontWeight: 600, color: "#2563eb" }}>
                          {c.report?.title || c.reportId}
                        </Link>
                      </td>
                      <td>{c.institution?.name}</td>
                      <td>
                        <span className="badge" style={{ bg: "#f1f5f9", color: "#334155" }}>{c.channel}</span>
                      </td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td style={{ color: new Date(c.dueAt) < new Date() ? "#dc2626" : "#475569", fontWeight: 600 }}>
                        {new Date(c.dueAt).toLocaleDateString("ro-RO")}
                      </td>
                      <td>
                        {c.status !== "ANSWERED" && c.status !== "CLOSED" ? (
                          <button
                            onClick={() => {
                              setSelectedComplaint(c);
                              setShowAnswerModal(true);
                            }}
                            className="btn btn-primary btn-sm"
                          >
                            <Send size={14} /> Răspunde Oficial
                          </button>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>Răspuns Înregistrat</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Quick Status Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title={`Schimbare Status (${selectedProblem?.code})`}>
        <div className="form-group">
          <label className="form-label">Selectează Noul Status</label>
          <select className="form-select" value={targetStatus} onChange={(e) => setTargetStatus(e.target.value)}>
            <option value="IN_REVIEW">În verificare (IN_REVIEW)</option>
            <option value="CONFIRMED">Confirmată (CONFIRMED)</option>
            <option value="ASSIGNED">Repartizată (ASSIGNED)</option>
            <option value="IN_PROGRESS">În lucru (IN_PROGRESS)</option>
            <option value="RESOLVED_PENDING_CONFIRMATION">Așteaptă confirmarea cetățeanului (RESOLVED_PENDING_CONFIRMATION)</option>
            <option value="REJECTED">Respinsă (REJECTED)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Comentariu / Explicativ (opțional)</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Introduceți note privind intervenția pe teren..."
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
          <button onClick={() => setShowStatusModal(false)} className="btn btn-secondary btn-sm">Anulează</button>
          <button onClick={handleUpdateStatus} className="btn btn-primary btn-sm">Aplica Noul Status</button>
        </div>
      </Modal>

      {/* Answer Formal Complaint Modal */}
      <Modal isOpen={showAnswerModal} onClose={() => setShowAnswerModal(false)} title={`Răspuns Oficial (${selectedComplaint?.referenceNumber})`}>
        <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1rem" }}>
          Introduceți textul răspunsului oficial ce va fi trimis cetățeanului și stocat în dosarul reclamației.
        </p>

        <div className="form-group">
          <label className="form-label">Text Răspuns Oficial (min. 5 caractere) *</label>
          <textarea
            className="form-textarea"
            rows={5}
            placeholder="Urmare a sesizării dvs. formale, vă informăm că echipa de intervenție..."
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            required
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
          <button onClick={() => setShowAnswerModal(false)} className="btn btn-secondary btn-sm">Anulează</button>
          <button onClick={handleAnswerComplaint} className="btn btn-primary btn-sm">Trimite Răspunsul Oficial</button>
        </div>
      </Modal>
    </div>
  );
}
