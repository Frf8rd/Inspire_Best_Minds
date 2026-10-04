import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { problemsApi } from "../api/problems.js";
import { complaintsApi } from "../api/complaints.js";
import { categoriesApi } from "../api/categories.js";
import { assetUrl } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { PriorityBadge } from "../components/PriorityBadge.jsx";
import { LeafletMap } from "../components/LeafletMap.jsx";
import { Modal } from "../components/Modal.jsx";
import {
  ThumbsUp,
  MessageSquare,
  History,
  Building,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Edit,
  Trash2,
  Send,
  Lock,
  Share2,
  MapPin,
} from "lucide-react";

export function ProblemDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [problem, setProblem] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Comment Form state
  const [newComment, setNewComment] = useState("");
  const [commentVisibility, setCommentVisibility] = useState("PUBLIC");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Resolution Confirmation modal / state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [resolutionOpinion, setResolutionOpinion] = useState(true);
  const [resolutionComment, setResolutionComment] = useState("");

  // Staff Status Change Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState("IN_PROGRESS");
  const [statusComment, setStatusComment] = useState("");

  // Edit Problem Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [editForm, setEditForm] = useState({ title: "", description: "", address: "", categoryId: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  // Formal Complaint Modal
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintChannel, setComplaintChannel] = useState("EMAIL");

  const loadProblemDetails = async () => {
    try {
      const [probRes, commRes, histRes] = await Promise.allSettled([
        problemsApi.getProblem(id),
        problemsApi.getComments(id),
        problemsApi.getHistory(id),
      ]);

      if (probRes.status === "fulfilled") {
        setProblem(probRes.value);
      }
      if (commRes.status === "fulfilled") {
        setComments(commRes.value.comments || []);
      }
      if (histRes.status === "fulfilled") {
        setHistory(histRes.value || []);
      }
    } catch (err) {
      addToast(err.message || "Eroare la încărcarea sesizării.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProblemDetails();
  }, [id]);

  // Support (+1) Handler
  const handleToggleSupport = async () => {
    if (!user) {
      addToast("Trebuie să fii autentificat pentru a susține sesizarea.", "warning");
      navigate("/login");
      return;
    }
    try {
      const res = await problemsApi.toggleSupport(id);
      setProblem((prev) => ({
        ...prev,
        supportCount: res.supportCount,
        priorityScore: res.priorityScore,
        priority: res.priority,
        hasSupported: res.supported,
      }));
      addToast(res.supported ? "Ai susținut sesizarea (+1)!" : "Ai retras susținerea.", "info");
    } catch (err) {
      addToast(err.message || "Eroare la susținerea sesizării.", "error");
    }
  };

  // Add Comment Handler
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
      addToast("Autentifică-te pentru a lăsa un comentariu.", "warning");
      return;
    }

    setSubmittingComment(true);
    try {
      const added = await problemsApi.addComment(id, {
        body: newComment.trim(),
        visibility: commentVisibility,
      });
      setComments((prev) => [...prev, added]);
      setNewComment("");
      addToast("Comentariul a fost adăugat!", "success");
    } catch (err) {
      addToast(err.message || "Eroare la adăugarea comentariului.", "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Confirm / Infirm Resolution Handler
  const handleConfirmResolution = async () => {
    try {
      const updated = await problemsApi.confirmResolution(id, {
        confirmed: resolutionOpinion,
        comment: resolutionComment,
      });
      setProblem((prev) => ({ ...prev, ...updated }));
      setShowConfirmModal(false);
      addToast(
        resolutionOpinion
          ? "Rezolvarea a fost confirmată cu succes!"
          : "Sesizarea a fost redeschisă.",
        "success"
      );
      loadProblemDetails();
    } catch (err) {
      addToast(err.message || "Eroare la procesarea confirmării.", "error");
    }
  };

  // Staff Status Change Handler
  const handleStatusChange = async () => {
    try {
      const updated = await problemsApi.updateStatus(id, {
        toStatus: targetStatus,
        comment: statusComment,
      });
      setProblem((prev) => ({ ...prev, ...updated }));
      setShowStatusModal(false);
      setStatusComment("");
      addToast(`Statusul a fost schimbat în ${targetStatus}`, "success");
      loadProblemDetails();
    } catch (err) {
      addToast(err.message || "Eroare la Schimbarea statusului.", "error");
    }
  };

  // Formal Complaint Handler
  const handleCreateComplaint = async () => {
    try {
      await complaintsApi.createComplaint(id, { channel: complaintChannel });
      setShowComplaintModal(false);
      addToast("Sesizarea formală oficială a fost expediată!", "success");
      loadProblemDetails();
    } catch (err) {
      addToast(err.message || "Eroare la expedierea sesizării formale.", "error");
    }
  };

  // Edit Problem Handlers
  const openEditModal = async () => {
    setEditForm({
      title: problem.title || "",
      description: problem.description || "",
      address: problem.address || "",
      categoryId: problem.category?.id || "",
    });
    setShowEditModal(true);
    if (categories.length === 0) {
      try {
        const res = await categoriesApi.getCategories();
        setCategories(res.categories || []);
      } catch {
        addToast("Nu s-au putut încărca categoriile.", "error");
      }
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const title = editForm.title.trim();
    if (title.length < 3 || title.length > 150) {
      addToast("Titlul trebuie să aibă între 3 și 150 de caractere.", "warning");
      return;
    }

    // Trimitem doar câmpurile modificate; schimbarea categoriei redirecționează sesizarea.
    const payload = { title };
    if (editForm.description.trim() !== (problem.description || "")) {
      payload.description = editForm.description.trim();
    }
    if (editForm.address.trim() !== (problem.address || "")) {
      payload.address = editForm.address.trim();
    }
    if (editForm.categoryId && editForm.categoryId !== problem.category?.id) {
      payload.categoryId = editForm.categoryId;
    }

    setSavingEdit(true);
    try {
      await problemsApi.updateProblem(id, payload);
      setShowEditModal(false);
      addToast("Sesizarea a fost actualizată.", "success");
      loadProblemDetails();
    } catch (err) {
      addToast(err.message || "Eroare la actualizarea sesizării.", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Problem Handler
  const handleDelete = async () => {
    if (!window.confirm("Sigur dorești să ștergi această sesizare?")) return;
    try {
      await problemsApi.deleteProblem(id);
      addToast("Sesizarea a fost ștearsă.", "info");
      navigate("/dashboard");
    } catch (err) {
      addToast(err.message || "Eroare la ștergerea sesizării.", "error");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 0", color: "#64748b" }}>
        Se încarcă detaliile sesizării...
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="container-custom" style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
        <h2>Sesizarea nu a fost găsită.</h2>
        <Link to="/problems" className="btn btn-primary" style={{ marginTop: "1rem" }}>
          Înapoi la sesizări
        </Link>
      </div>
    );
  }

  // GET /problems/:id întoarce reporter: { id, name }, nu reporterId.
  const isAuthor = Boolean(user && problem.reporter && user.id === problem.reporter.id);
  const canManage = isAuthor || user?.role === "ADMIN"; // la fel ca în backend (proprietar sau admin)
  const isStaff = user && (user.role === "STAFF" || user.role === "ADMIN");

  return (
    <div className="container-custom" style={{ padding: "2.5rem 1.5rem" }}>
      {/* Header Info */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#2563eb" }}>
              {problem.code}
            </span>
            <StatusBadge status={problem.status} />
            <PriorityBadge priority={problem.priority} score={problem.priorityScore} />
          </div>

          {/* Actions Bar */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {canManage && (
              <>
                <button onClick={openEditModal} className="btn btn-outline btn-sm">
                  <Edit size={16} /> Editează
                </button>
                <button onClick={handleDelete} className="btn btn-danger btn-sm">
                  <Trash2 size={16} /> Șterge
                </button>
              </>
            )}

            {isStaff && (
              <button onClick={() => setShowStatusModal(true)} className="btn btn-primary btn-sm">
                Schimbă Status
              </button>
            )}
          </div>
        </div>

        <h1 style={{ fontSize: "2rem", color: "#0f172a", marginBottom: "0.5rem" }}>
          {problem.title}
        </h1>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", fontSize: "0.875rem", color: "#64748b" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <MapPin size={16} /> {problem.address || "Nesemnată"}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Calendar size={16} /> {new Date(problem.createdAt).toLocaleString("ro-RO")}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <User size={16} /> Raportat de: {problem.reporter?.name || "Cetățean"}
          </span>
        </div>
      </div>

      {/* Citizen Resolution Confirmation Box if status is RESOLVED_PENDING_CONFIRMATION */}
      {problem.status === "RESOLVED_PENDING_CONFIRMATION" && (
        <div
          className="card animate-fade-in"
          style={{
            padding: "1.5rem",
            marginBottom: "2rem",
            background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
            border: "2px solid #f97316",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#c2410c", fontWeight: 700, fontSize: "1.15rem", marginBottom: "0.5rem" }}>
            <AlertOctagon size={26} />
            Problema a fost declarată rezolvată de către autorități!
          </div>
          <p style={{ color: "#9a3412", fontSize: "0.95rem", marginBottom: "1rem" }}>
            Bifează mai jos dacă problema pe teren este într-adevăr remediată conform așteptărilor.
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={() => {
                setResolutionOpinion(true);
                setShowConfirmModal(true);
              }}
              className="btn btn-success"
            >
              <CheckCircle2 size={18} /> DA — Confirm rezolvarea
            </button>
            <button
              onClick={() => {
                setResolutionOpinion(false);
                setShowConfirmModal(true);
              }}
              className="btn btn-danger"
            >
              <XCircle size={18} /> NU — Problema încă persistă
            </button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
        {/* Left Column: Description, Photos, Map, Support & Comments */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Description Card */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Descriere</h3>
            <p style={{ color: "#334155", lineHeight: "1.6", whiteSpace: "pre-line" }}>
              {problem.description || "Fără descriere adăugată."}
            </p>

            {/* Photos Gallery */}
            {problem.photos && problem.photos.length > 0 && (
              <div style={{ marginTop: "1.5rem" }}>
                <h4 style={{ fontSize: "0.95rem", marginBottom: "0.75rem", color: "#64748b" }}>Fotografii atașate</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.75rem" }}>
                  {problem.photos.map((ph) => (
                    <a key={ph.id} href={assetUrl(ph.publicPath)} target="_blank" rel="noopener noreferrer">
                      <img
                        src={assetUrl(ph.publicPath)}
                        alt="Photo"
                        style={{
                          width: "100%",
                          height: "100px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid var(--border-color)",
                        }}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Map */}
          <div className="card" style={{ padding: "1rem" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Locație GPS</h3>
            <LeafletMap problems={[problem]} center={[problem.latitude, problem.longitude]} zoom={15} height="320px" />
          </div>

          {/* Support CTA Card */}
          <div
            className="card"
            style={{
              padding: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: problem.hasSupported ? "#ecfdf5" : "#f8fafc",
              borderColor: problem.hasSupported ? "#a7f3d0" : "#e2e8f0",
            }}
          >
            <div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                👍 +{problem.supportCount || 0} susțineri cetățenești
              </div>
              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Susținerea adăugată crește automat scorul de prioritate al tichetului.
              </div>
            </div>

            <button
              onClick={handleToggleSupport}
              className={`btn ${problem.hasSupported ? "btn-success" : "btn-primary"}`}
            >
              <ThumbsUp size={18} /> {problem.hasSupported ? "Susținut (+1)" : "+1 Susțin problema"}
            </button>
          </div>

          {/* Formal Complaint Button */}
          <div className="card" style={{ padding: "1.25rem", background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Ai nevoie de o sesizare formală oficială?</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Expediază o reclamație cu termen legal de răspuns către instituție.
                </div>
              </div>
              <button onClick={() => setShowComplaintModal(true)} className="btn btn-outline btn-sm">
                Depune Sesizare Formală
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MessageSquare size={20} /> Comentarii ({comments.length})
            </h3>

            {/* Comment Form */}
            {user ? (
              <form onSubmit={handleAddComment} style={{ marginBottom: "1.5rem" }}>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Scrie un comentariu sau o precizare despre această sesizare..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" }}>
                  {isStaff ? (
                    <select
                      className="form-select"
                      style={{ width: "auto", fontSize: "0.8rem" }}
                      value={commentVisibility}
                      onChange={(e) => setCommentVisibility(e.target.value)}
                    >
                      <option value="PUBLIC">Comentariu Public (vizibil tuturor)</option>
                      <option value="INTERNAL">Comentariu Intern Staff (privat)</option>
                    </select>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Vizibil public</span>
                  )}

                  <button type="submit" className="btn btn-primary btn-sm" disabled={submittingComment}>
                    <Send size={14} /> Trimite
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ padding: "1rem", background: "#f1f5f9", borderRadius: "8px", textAlign: "center", marginBottom: "1.5rem" }}>
                <Link to="/login" style={{ fontWeight: 700 }}>Autentifică-te</Link> pentru a adăuga un comentariu.
              </div>
            )}

            {/* Comments List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: "0.875rem 1rem",
                    borderRadius: "10px",
                    backgroundColor: c.visibility === "INTERNAL" ? "#fef3c7" : "#f8fafc",
                    border: "1px solid",
                    borderColor: c.visibility === "INTERNAL" ? "#fde68a" : "#e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a" }}>
                      {c.author?.name || "Utilizator"} {c.visibility === "INTERNAL" && <span style={{ color: "#b45309", fontSize: "0.75rem" }}>(Intern Staff)</span>}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {new Date(c.createdAt).toLocaleString("ro-RO")}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.9rem", color: "#334155", margin: 0, lineHeight: 1.4 }}>
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Institution Info & Timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Department & Institution Info */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Building size={20} style={{ color: "#2563eb" }} /> Responsabilitate Institutională
            </h3>

            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Departament Repartizat:</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                {problem.department?.name || "În curs de repartizare automată"}
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Instituție Competentă:</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#334155" }}>
                {problem.department?.institution?.name || "Primăria Municipiului"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Responsabil Alocat:</div>
              <div style={{ fontSize: "0.875rem", color: "#334155" }}>
                {problem.assignee?.name || "Nealocat"}
              </div>
            </div>
          </div>

          {/* Timeline / Status History */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <History size={20} style={{ color: "#2563eb" }} /> Istoric & Timeline
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "relative" }}>
              {history.map((h, i) => (
                <div key={h.id || i} style={{ display: "flex", gap: "0.75rem", fontSize: "0.85rem" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#2563eb", marginTop: "4px", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                      Tranziție: <StatusBadge status={h.toStatus} />
                    </div>
                    {h.comment && <div style={{ color: "#475569", marginTop: "2px" }}>{h.comment}</div>}
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                      {new Date(h.createdAt).toLocaleString("ro-RO")} • {h.author?.name || "Sistem"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Citizen Resolution Confirmation Modal */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirmare Rezolvare">
        <p style={{ marginBottom: "1rem", color: "#334155" }}>
          {resolutionOpinion
            ? "Confirmi că problema raportată a fost remediată complet pe teren?"
            : "Infirmi rezolvarea? Sesizarea va fi redeschisă pe statusul REOPENED."}
        </p>

        <div className="form-group">
          <label className="form-label">Comentariu / Detalii (opțional)</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Adaugă un comentariu pentru autorități..."
            value={resolutionComment}
            onChange={(e) => setResolutionComment(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
          <button onClick={() => setShowConfirmModal(false)} className="btn btn-secondary btn-sm">
            Anulează
          </button>
          <button onClick={handleConfirmResolution} className={`btn btn-sm ${resolutionOpinion ? "btn-success" : "btn-danger"}`}>
            Trimite Decizia
          </button>
        </div>
      </Modal>

      {/* Staff Status Change Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Schimbare Status Sesizare">
        <div className="form-group">
          <label className="form-label">Noul Status</label>
          <select
            className="form-select"
            value={targetStatus}
            onChange={(e) => setTargetStatus(e.target.value)}
          >
            <option value="IN_REVIEW">În verificare (IN_REVIEW)</option>
            <option value="CONFIRMED">Confirmată (CONFIRMED)</option>
            <option value="ASSIGNED">Repartizată (ASSIGNED)</option>
            <option value="IN_PROGRESS">În lucru (IN_PROGRESS)</option>
            <option value="RESOLVED_PENDING_CONFIRMATION">Așteaptă confirmarea (RESOLVED_PENDING_CONFIRMATION)</option>
            <option value="REJECTED">Respinsă (REJECTED)</option>
            <option value="NEEDS_INFO">Necesită informații (NEEDS_INFO)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Comentariu / Motivare Tranziție</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Explică schimbarea de status..."
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
          <button onClick={() => setShowStatusModal(false)} className="btn btn-secondary btn-sm">
            Anulează
          </button>
          <button onClick={handleStatusChange} className="btn btn-primary btn-sm">
            Salvează Statusul
          </button>
        </div>
      </Modal>

      {/* Edit Problem Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editează Sesizarea">
        <form onSubmit={handleSaveEdit}>
          <div className="form-group">
            <label className="form-label">Titlu</label>
            <input
              type="text"
              className="form-input"
              value={editForm.title}
              maxLength={150}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descriere</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Adresă</label>
            <input
              type="text"
              className="form-input"
              value={editForm.address}
              onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Categorie</label>
            <select
              className="form-select"
              value={editForm.categoryId}
              onChange={(e) => setEditForm((f) => ({ ...f, categoryId: e.target.value }))}
            >
              {categories.length === 0 && problem.category && (
                <option value={problem.category.id}>{problem.category.name}</option>
              )}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
              Schimbarea categoriei poate redirecționa sesizarea către alt departament.
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
            <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary btn-sm">
              Anulează
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={savingEdit}>
              {savingEdit ? "Se salvează..." : "Salvează modificările"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Formal Complaint Modal */}
      <Modal isOpen={showComplaintModal} onClose={() => setShowComplaintModal(false)} title="Depunere Sesizare Formală">
        <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "1rem" }}>
          O sesizare formală înregistrează un tichet oficial cu termen legal obligatoriu de răspuns.
        </p>

        <div className="form-group">
          <label className="form-label">Canal de Transmitere</label>
          <select className="form-select" value={complaintChannel} onChange={(e) => setComplaintChannel(e.target.value)}>
            <option value="EMAIL">Email Oficial (EMAIL)</option>
            <option value="PDF">Document PDF (PDF)</option>
            <option value="PORTAL">Portal Instituțional (PORTAL)</option>
          </select>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
          <button onClick={() => setShowComplaintModal(false)} className="btn btn-secondary btn-sm">
            Anulează
          </button>
          <button onClick={handleCreateComplaint} className="btn btn-primary btn-sm">
            Expediază Sesizarea Formală
          </button>
        </div>
      </Modal>
    </div>
  );
}
