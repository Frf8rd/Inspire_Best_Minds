import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { problemsApi } from "../api/problems.js";
import { complaintsApi } from "../api/complaints.js";
import { analyticsApi } from "../api/analytics.js";
import { institutionsApi } from "../api/institutions.js";
import { useAuth } from "../context/AuthContext.jsx";
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
  UserPlus,
  Trash2,
} from "lucide-react";

export function StaffDashboardPage() {
  const { user } = useAuth();
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
  const [teamInstitutions, setTeamInstitutions] = useState([]);
  const [teamInstitutionId, setTeamInstitutionId] = useState(
    user?.memberships?.[0]?.institution?.id || ""
  );
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("HANDLER");
  const [myProblemIds, setMyProblemIds] = useState(() => new Set());
  const [transparencyReport, setTransparencyReport] = useState(null);

  const staffMemberships = user?.memberships || [];
  const managerMemberships = staffMemberships.filter((membership) => membership.role === "MANAGER");
  const managerInstitutionIds = managerMemberships.map((membership) => membership.institution.id).join(",");
  const staffInstitutionIds = staffMemberships.map((membership) => membership.institution.id).join(",");

  const loadStaffData = async () => {
    setLoading(true);
    const institutionId = teamInstitutionId || undefined;
    try {
      const [probsRes, compRes, statsRes, ownProblemsRes] = await Promise.allSettled([
        problemsApi.getProblems({
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          institutionId,
          limit: 50,
        }),
        complaintsApi.getComplaints(),
        analyticsApi.getDashboardStats(institutionId ? { institutionId } : {}),
        problemsApi.getMyProblems({ limit: 100 }),
      ]);

      if (probsRes.status === "rejected") {
        addToast(probsRes.reason?.message || "Nu s-au putut încărca sesizările instituției.", "error");
      }
      if (compRes.status === "fulfilled") {
        setComplaints((compRes.value.complaints || []).filter(
          (complaint) => !institutionId || complaint.institution?.id === institutionId
        ));
      } else {
        addToast(compRes.reason?.message || "Nu s-au putut încărca reclamațiile instituției.", "error");
      }
      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value);
      } else {
        addToast(statsRes.reason?.message || "Nu s-au putut încărca statisticile instituției.", "error");
      }
      if (ownProblemsRes.status === "fulfilled") {
        const ownItems = (ownProblemsRes.value.items || []).filter((item) =>
          (!statusFilter || item.status === statusFilter) &&
          (!priorityFilter || item.priority === priorityFilter)
        );
        setMyProblemIds(new Set(ownItems.map((item) => item.id)));
        const combined = new Map((probsRes.status === "fulfilled" ? probsRes.value.items || [] : []).map((item) => [item.id, item]));
        ownItems.forEach((item) => combined.set(item.id, item));
        setProblems([...combined.values()].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt)));
      } else if (probsRes.status === "fulfilled") {
        addToast(ownProblemsRes.reason?.message || "Nu s-au putut încărca sesizările create de tine.", "error");
        setMyProblemIds(new Set());
        setProblems(probsRes.value.items || []);
      }
    } catch (err) {
      console.error("Staff dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, [statusFilter, priorityFilter, teamInstitutionId]);

  useEffect(() => {
    let isCurrent = true;
    const loadStaffInstitutions = async () => {
      if (!staffInstitutionIds) {
        setTeamInstitutions([]);
        setTeamInstitutionId("");
        return;
      }
      try {
        const responses = await Promise.all(
          staffInstitutionIds.split(",").map((id) => institutionsApi.getInstitution(id))
        );
        const institutions = responses.map((response) => response.institution);
        if (isCurrent) {
          setTeamInstitutions(institutions);
          setTeamInstitutionId((currentId) =>
            institutions.some((institution) => institution.id === currentId)
              ? currentId
              : institutions[0]?.id || ""
          );
        }
      } catch (err) {
        if (isCurrent) {
          addToast(err.message || "Nu s-au putut încărca datele instituțiilor.", "error");
        }
      }
    };
    loadStaffInstitutions();
    return () => {
      isCurrent = false;
    };
  }, [staffInstitutionIds, addToast]);

  useEffect(() => {
    let isCurrent = true;
    const institution = teamInstitutions.find((item) => item.id === teamInstitutionId);
    if (!institution?.slug) {
      setTransparencyReport(null);
      return () => { isCurrent = false; };
    }
    analyticsApi.getTransparencyReport(institution.slug)
      .then((report) => {
        if (isCurrent) setTransparencyReport(report);
      })
      .catch((err) => {
        if (isCurrent) addToast(err.message || "Nu s-au putut încărca statisticile instituției.", "error");
      });
    return () => { isCurrent = false; };
  }, [teamInstitutions, teamInstitutionId, addToast]);

  const handleAddTeamMember = async (event) => {
    event.preventDefault();
    if (!managerInstitutionIds.split(",").includes(teamInstitutionId)) {
      addToast("Doar un manager al instituției poate adăuga membri.", "error");
      return;
    }
    if (!teamInstitutionId || !newMemberEmail.trim()) {
      addToast("Completează emailul și selectează instituția.", "warning");
      return;
    }
    try {
      await institutionsApi.addMember(teamInstitutionId, {
        email: newMemberEmail.trim(),
        role: newMemberRole,
      });
      addToast("Membrul a fost adăugat în echipa instituției.", "success");
      setNewMemberEmail("");
      const { institution: updatedInstitution } = await institutionsApi.getInstitution(teamInstitutionId);
      setTeamInstitutions((current) =>
        current.map((institution) => institution.id === updatedInstitution.id ? updatedInstitution : institution)
      );
    } catch (err) {
      addToast(err.message || "Nu s-a putut adăuga membrul în echipă.", "error");
    }
  };

  const handleDeleteOwnProblem = async (problem) => {
    if (!myProblemIds.has(problem.id)) return;
    if (!window.confirm(`Sigur dorești să ștergi sesizarea „${problem.title}”?`)) return;
    try {
      await problemsApi.deleteProblem(problem.id);
      addToast("Sesizarea ta a fost ștearsă.", "success");
      await loadStaffData();
    } catch (err) {
      addToast(err.message || "Nu s-a putut șterge sesizarea.", "error");
    }
  };

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
    <div className="container-custom staff-dashboard">
      <header className="staff-dashboard-hero">
        <span className="staff-dashboard-icon"><Briefcase size={25} /></span>
        <div>
          <span className="staff-dashboard-eyebrow">Administrare operațională</span>
          <h1>Panou de Gestionare Staff & Instituții</h1>
          <p>Evaluează tichetele departamentului, schimbă statusul și înregistrează răspunsuri oficiale la reclamații.</p>
        </div>
      </header>

      <section className="staff-institution-overview" aria-labelledby="staff-institution-title">
        <div className="staff-institution-overview-heading">
          <div>
            <span className="staff-institution-kicker">Instituția ta</span>
            <h2 id="staff-institution-title">
              {teamInstitutions.find((institution) => institution.id === teamInstitutionId)?.name || "Instituție"}
            </h2>
          </div>
          {teamInstitutions.length > 1 && (
            <label className="staff-team-institution-picker">
              <span>Selectează instituția</span>
              <select value={teamInstitutionId} onChange={(event) => setTeamInstitutionId(event.target.value)}>
                {teamInstitutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>{institution.name}</option>
                ))}
              </select>
            </label>
          )}
        </div>
        {(() => {
          const institution = teamInstitutions.find((item) => item.id === teamInstitutionId);
          if (!institution) {
            return <p className="staff-institution-empty">Contul tău nu este asociat momentan unei instituții.</p>;
          }
          return (
            <>
              <p className="staff-institution-description">
                {institution.description || "Profilul instituției și activitatea sa în gestionarea sesizărilor."}
              </p>
              <div className="staff-institution-details">
                <span><strong>Contact</strong>{institution.contactEmail || "Nespecificat"}</span>
                <span><strong>Termen de răspuns</strong>{institution.responseDeadlineDays} zile</span>
                <span><strong>Departamente</strong>{institution.departments?.length || 0}</span>
                <span><strong>Sesizări rezolvate</strong>{transparencyReport?.metrics?.resolvedReportsCount ?? stats?.statusCounts?.RESOLVED ?? 0}</span>
              </div>
              {institution.departments?.length > 0 && (
                <div className="staff-institution-departments">
                  {institution.departments.map((department) => (
                    <span className="badge" key={department.id}>{department.name}</span>
                  ))}
                </div>
              )}
              {transparencyReport?.metrics && (
                <div className="staff-transparency-metrics">
                  <span>Rata de rezolvare <strong>{transparencyReport.metrics.resolutionRatePercentage}%</strong></span>
                  <span>Timp mediu de rezolvare <strong>{transparencyReport.metrics.avgResolutionDays == null ? "—" : `${transparencyReport.metrics.avgResolutionDays} zile`}</strong></span>
                  <Link to={`/analytics/transparency/${institution.slug}`}>Vezi profilul public <Eye size={13} /></Link>
                </div>
              )}
            </>
          );
        })()}
      </section>

      {/* Summary Stat Cards */}
      <section className="staff-stat-grid" aria-label="Rezumatul activității">
        <article className="card staff-stat-card staff-stat-new">
          <span className="staff-stat-icon"><AlertCircle size={20} /></span>
          <div className="staff-stat-copy"><span>Tichete noi</span>
          <strong>
            {stats?.statusCounts?.NEW || 0}
          </strong></div>
          <small>Necesită preluare</small>
        </article>

        <article className="card staff-stat-card staff-stat-progress">
          <span className="staff-stat-icon"><Clock size={20} /></span>
          <div className="staff-stat-copy"><span>În lucru</span>
          <strong>
            {stats?.statusCounts?.IN_PROGRESS || 0}
          </strong></div>
          <small>Intervenții active</small>
        </article>

        <article className="card staff-stat-card staff-stat-confirm">
          <span className="staff-stat-icon"><CheckCircle2 size={20} /></span>
          <div className="staff-stat-copy"><span>Așteaptă confirmarea</span>
          <strong>
            {stats?.statusCounts?.RESOLVED_PENDING_CONFIRMATION || 0}
          </strong></div>
          <small>Finalizate de instituție</small>
        </article>

        <article className="card staff-stat-card staff-stat-resolved">
          <span className="staff-stat-icon"><CheckCircle2 size={20} /></span>
          <div className="staff-stat-copy"><span>Rezolvate de instituție</span>
          <strong>{transparencyReport?.metrics?.resolvedReportsCount ?? stats?.statusCounts?.RESOLVED ?? 0}</strong></div>
          <small>Sesizări finalizate</small>
        </article>

        <article className="card staff-stat-card staff-stat-complaints">
          <span className="staff-stat-icon"><FileText size={20} /></span>
          <div className="staff-stat-copy"><span>Reclamații formale active</span>
          <strong>
            {complaints.filter((c) => c.status === "SENT" || c.status === "ACKNOWLEDGED").length}
          </strong></div>
          <small>Răspuns oficial necesar</small>
        </article>
      </section>

      {/* Tabs */}
      <div className="staff-tabs" role="tablist" aria-label="Tipul sesizărilor">
        <button
          type="button"
          onClick={() => setTab("problems")}
          aria-selected={tab === "problems"}
          role="tab"
          className={`staff-tab ${tab === "problems" ? "is-active" : ""}`}
        >
          <Briefcase size={17} /> Sesizări Departament <span>{problems.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("complaints")}
          aria-selected={tab === "complaints"}
          role="tab"
          className={`staff-tab ${tab === "complaints" ? "is-active" : ""}`}
        >
          <FileText size={17} /> Reclamații Formale <span>{complaints.length}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("problems");
            setStatusFilter("RESOLVED");
          }}
          aria-selected={tab === "problems" && statusFilter === "RESOLVED"}
          role="tab"
          className={`staff-tab ${tab === "problems" && statusFilter === "RESOLVED" ? "is-active" : ""}`}
        >
          <CheckCircle2 size={17} /> Sesizări rezolvate
        </button>
      </div>

      {/* Tab 1: Problems List */}
      {tab === "problems" && (
        <section className="card staff-data-panel" role="tabpanel">
          {/* Filter Bar */}
          <div className="staff-filter-bar">
            <div className="staff-filter-label">
              <Filter size={17} /> Filtrează sesizările
            </div>
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrare după status">
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

            <select className="form-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} aria-label="Filtrare după prioritate">
              <option value="">Toate Prioritățile</option>
              <option value="CRITICAL">Critică</option>
              <option value="HIGH">Ridicată</option>
              <option value="MEDIUM">Medie</option>
              <option value="LOW">Scăzută</option>
            </select>
          </div>

          {loading ? (
            <div className="staff-table-state">Se încarcă sesizările...</div>
          ) : problems.length === 0 ? (
            <div className="staff-table-state">
              Nu există tichete pe filtrele selectate.
            </div>
          ) : (
            <div className="staff-table-wrap">
              <table className="custom-table staff-table">
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
                      <td className="staff-code">{item.code}</td>
                      <td className="staff-title">{item.title}</td>
                      <td>{item.category?.name || "Nespecificată"}</td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>
                        <PriorityBadge priority={item.priority} score={item.priorityScore} />
                      </td>
                      <td className="staff-support">+{item.supportCount || 0}</td>
                      <td className="staff-date">{new Date(item.createdAt).toLocaleDateString("ro-RO")}</td>
                      <td>
                        <div className="staff-row-actions">
                          <Link to={`/problems/${item.id}`} className="btn btn-secondary btn-sm staff-view-button">
                            <Eye size={14} /> Vezi
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedProblem(item);
                              setShowStatusModal(true);
                            }}
                            className="btn btn-primary btn-sm staff-action-button"
                          >
                            <Edit size={14} /> Status
                          </button>
                          {myProblemIds.has(item.id) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteOwnProblem(item)}
                              className="btn btn-secondary btn-sm staff-delete-own-button"
                              title="Șterge sesizarea creată de tine"
                              aria-label={`Șterge sesizarea ${item.code}`}
                            >
                              <Trash2 size={14} /> Șterge
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Formal Complaints List */}
      {tab === "complaints" && (
        <section className="card staff-data-panel" role="tabpanel">
          {complaints.length === 0 ? (
            <div className="staff-table-state">
              Nu există nicio reclamație formală înregistrată.
            </div>
          ) : (
            <div className="staff-table-wrap">
              <table className="custom-table staff-table">
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
                      <td className="staff-code">{c.referenceNumber}</td>
                      <td>
                        <Link className="staff-problem-link" to={`/problems/${c.reportId}`}>
                          {c.report?.title || c.reportId}
                        </Link>
                      </td>
                      <td>{c.institution?.name}</td>
                      <td>
                        <span className="badge staff-channel-badge">{c.channel}</span>
                      </td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td className={new Date(c.dueAt) < new Date() ? "staff-date staff-date-overdue" : "staff-date"}>
                        {new Date(c.dueAt).toLocaleDateString("ro-RO")}
                      </td>
                      <td>
                        {c.status !== "ANSWERED" && c.status !== "CLOSED" ? (
                          <button
                            onClick={() => {
                              setSelectedComplaint(c);
                              setShowAnswerModal(true);
                            }}
                            className="btn btn-primary btn-sm staff-action-button"
                          >
                            <Send size={14} /> Răspunde Oficial
                          </button>
                        ) : (
                          <span className="staff-answer-done">Răspuns înregistrat</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {managerMemberships.length > 0 && managerInstitutionIds.split(",").includes(teamInstitutionId) && (
        <section className="card staff-team-panel" aria-labelledby="staff-team-title">
          <div className="staff-team-heading">
            <div>
              <span className="staff-team-eyebrow">Administrarea echipei</span>
              <h2 id="staff-team-title">Membrii instituției</h2>
              <p>Adaugă operatori sau manageri în instituțiile pe care le gestionezi.</p>
            </div>
          </div>

          <form className="staff-team-form" onSubmit={handleAddTeamMember}>
            <label>
              <span>Email-ul utilizatorului</span>
              <input
                type="email"
                value={newMemberEmail}
                onChange={(event) => setNewMemberEmail(event.target.value)}
                placeholder="nume@exemplu.md"
                required
              />
            </label>
            <label>
              <span>Rol în instituție</span>
              <select value={newMemberRole} onChange={(event) => setNewMemberRole(event.target.value)}>
                <option value="HANDLER">Staff operator</option>
                <option value="MANAGER">Staff manager</option>
              </select>
            </label>
            <button type="submit" className="staff-team-submit" disabled={!teamInstitutionId}>
              <UserPlus size={16} /> Adaugă în echipă
            </button>
          </form>

          <div className="staff-team-roster">
            {teamInstitutions.find((institution) => institution.id === teamInstitutionId)?.memberships?.length ? (
              teamInstitutions.find((institution) => institution.id === teamInstitutionId).memberships.map((membership) => (
                <article className="staff-team-member" key={membership.id}>
                  <div className="staff-team-avatar">{membership.user.name?.slice(0, 1).toUpperCase() || "S"}</div>
                  <div className="staff-team-member-info">
                    <strong>{membership.user.name}</strong>
                    <span>{membership.user.email}</span>
                  </div>
                  <span className={`staff-team-role ${membership.role === "MANAGER" ? "is-manager" : ""}`}>
                    {membership.role === "MANAGER" ? "Staff manager" : "Staff operator"}
                  </span>
                </article>
              ))
            ) : (
              <div className="staff-team-empty">Nu există membri în această echipă încă.</div>
            )}
          </div>
        </section>
      )}

      {/* Quick Status Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title={`Schimbare Status (${selectedProblem?.code})`} className="staff-modal">
        <div className="form-group">
          <label className="form-label">Selectează Noul Status</label>
          <select className="form-select" value={targetStatus} onChange={(e) => setTargetStatus(e.target.value)} aria-label="Selectează noul status">
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

        <div className="staff-modal-actions">
          <button onClick={() => setShowStatusModal(false)} className="btn btn-secondary btn-sm">Anulează</button>
          <button onClick={handleUpdateStatus} className="btn btn-primary btn-sm">Aplica Noul Status</button>
        </div>
      </Modal>

      {/* Answer Formal Complaint Modal */}
      <Modal isOpen={showAnswerModal} onClose={() => setShowAnswerModal(false)} title={`Răspuns Oficial (${selectedComplaint?.referenceNumber})`} className="staff-modal">
        <p className="staff-modal-intro">
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

        <div className="staff-modal-actions">
          <button onClick={() => setShowAnswerModal(false)} className="btn btn-secondary btn-sm">Anulează</button>
          <button onClick={handleAnswerComplaint} className="btn btn-primary btn-sm">Trimite Răspunsul Oficial</button>
        </div>
      </Modal>
    </div>
  );
}
