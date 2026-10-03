import React, { useState, useEffect } from "react";
import { analyticsApi } from "../api/analytics.js";
import { adminApi } from "../api/admin.js";
import { categoriesApi } from "../api/categories.js";
import { institutionsApi } from "../api/institutions.js";
import { useToast } from "../context/ToastContext.jsx";
import { Modal } from "../components/Modal.jsx";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Shield,
  Users,
  Layers,
  Building,
  GitMerge,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
} from "lucide-react";

const STATUS_COLORS = {
  NEW: "#3b82f6",
  IN_PROGRESS: "#eab308",
  RESOLVED: "#10b981",
  REJECTED: "#64748b",
  DUPLICATE: "#94a3b8",
};

export function AdminDashboardPage() {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'users' | 'categories' | 'institutions' | 'routing'

  // Data states
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [routingRules, setRoutingRules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal forms states
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDesc, setCatDesc] = useState("");

  const [showInstModal, setShowInstModal] = useState(false);
  const [instName, setInstName] = useState("");
  const [instSlug, setInstSlug] = useState("");
  const [instEmail, setInstEmail] = useState("");
  const [instDeadline, setInstDeadline] = useState(30);

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [targetInstId, setTargetInstId] = useState("");
  const [deptName, setDeptName] = useState("");

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("HANDLER");

  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleCatId, setRuleCatId] = useState("");
  const [ruleDeptId, setRuleDeptId] = useState("");
  const [rulePrecedence, setRulePrecedence] = useState(1);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, catsRes, instsRes, rulesRes] = await Promise.allSettled([
        analyticsApi.getDashboardStats(),
        adminApi.getUsers({ limit: 100 }),
        categoriesApi.getCategories(true),
        institutionsApi.getInstitutions(),
        institutionsApi.getRoutingRules(),
      ]);

      if (statsRes.status === "fulfilled") setStats(statsRes.value);
      if (usersRes.status === "fulfilled") setUsers(usersRes.value.users || []);
      if (catsRes.status === "fulfilled") setCategories(catsRes.value.categories || []);
      if (instsRes.status === "fulfilled") setInstitutions(instsRes.value.institutions || []);
      if (rulesRes.status === "fulfilled") setRoutingRules(rulesRes.value.rules || []);
    } catch (err) {
      console.error("Admin dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // User management handlers
  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      addToast("Rolul utilizatorului a fost actualizat!", "success");
      loadAdminData();
    } catch (err) {
      addToast(err.message || "Eroare la schimbarea rolului.", "error");
    }
  };

  const handleStatusToggle = async (userId, currentActive) => {
    try {
      await adminApi.updateUserStatus(userId, !currentActive);
      addToast(`Utilizatorul a fost ${!currentActive ? "activat" : "dezactivat"}!`, "success");
      loadAdminData();
    } catch (err) {
      addToast(err.message || "Eroare la Schimbarea statusului utilizatorului.", "error");
    }
  };

  // Category handlers
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await categoriesApi.createCategory({ name: catName, slug: catSlug, description: catDesc });
      addToast("Categoria a fost creată!", "success");
      setShowCatModal(false);
      setCatName(""); setCatSlug(""); setCatDesc("");
      loadAdminData();
    } catch (err) {
      addToast(err.message || "Eroare la crearea categoriei.", "error");
    }
  };

  // Institution & Department handlers
  const handleCreateInstitution = async (e) => {
    e.preventDefault();
    try {
      await institutionsApi.createInstitution({
        name: instName,
        slug: instSlug,
        contactEmail: instEmail,
        responseDeadlineDays: Number(instDeadline),
      });
      addToast("Instituția a fost creată!", "success");
      setShowInstModal(false);
      setInstName(""); setInstSlug(""); setInstEmail("");
      loadAdminData();
    } catch (err) {
      addToast(err.message || "Eroare la crearea instituției.", "error");
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    try {
      await institutionsApi.addDepartment(targetInstId, { name: deptName });
      addToast("Departamentul a fost adăugat!", "success");
      setShowDeptModal(false);
      setDeptName("");
      loadAdminData();
    } catch (err) {
      addToast(err.message || "Eroare la adăugarea departamentului.", "error");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await institutionsApi.addMember(targetInstId, { email: memberEmail, role: memberRole });
      addToast("Membru adăugat în instituție!", "success");
      setShowMemberModal(false);
      setMemberEmail("");
      loadAdminData();
    } catch (err) {
      addToast(err.message || "Eroare la adăugarea membrului.", "error");
    }
  };

  // Routing Rules handlers
  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      await institutionsApi.createRoutingRule({
        categoryId: ruleCatId,
        departmentId: ruleDeptId,
        precedence: Number(rulePrecedence),
      });
      addToast("Regula de rutare a fost creată!", "success");
      setShowRuleModal(false);
      loadAdminData();
    } catch (err) {
      addToast(err.message || "Eroare la crearea regulii de rutare.", "error");
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      await institutionsApi.deleteRoutingRule(id);
      addToast("Regula de rutare a fost ștearsă!", "info");
      loadAdminData();
    } catch (err) {
      addToast(err.message || "Eroare la ștergerea regulii.", "error");
    }
  };

  // Chart data formatters
  const statusPieData = stats?.statusCounts
    ? Object.entries(stats.statusCounts).map(([status, count]) => ({
        name: status,
        value: count,
      }))
    : [];

  const priorityBarData = stats?.priorityCounts
    ? Object.entries(stats.priorityCounts).map(([priority, count]) => ({
        name: priority,
        Count: count,
      }))
    : [];

  return (
    <div className="container-custom" style={{ padding: "2.5rem 1.5rem" }}>
      {/* Title Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Shield size={28} style={{ color: "#2563eb" }} /> Panou de Administrare Sistem
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Control complet asupra utilizatorilor, instituțiilor, categoriilor și regulilor de rutare automată.
        </p>
      </div>

      {/* Admin Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "2rem",
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "0.5rem",
          overflowX: "auto",
        }}
      >
        <button onClick={() => setActiveTab("overview")} className={`btn btn-sm ${activeTab === "overview" ? "btn-primary" : "btn-secondary"}`}>
          <BarChart3 size={16} /> Statistici Sistem
        </button>
        <button onClick={() => setActiveTab("users")} className={`btn btn-sm ${activeTab === "users" ? "btn-primary" : "btn-secondary"}`}>
          <Users size={16} /> Utilizatori ({users.length})
        </button>
        <button onClick={() => setActiveTab("categories")} className={`btn btn-sm ${activeTab === "categories" ? "btn-primary" : "btn-secondary"}`}>
          <Layers size={16} /> Categorii ({categories.length})
        </button>
        <button onClick={() => setActiveTab("institutions")} className={`btn btn-sm ${activeTab === "institutions" ? "btn-primary" : "btn-secondary"}`}>
          <Building size={16} /> Instituții ({institutions.length})
        </button>
        <button onClick={() => setActiveTab("routing")} className={`btn btn-sm ${activeTab === "routing" ? "btn-primary" : "btn-secondary"}`}>
          <GitMerge size={16} /> Reguli Rutare ({routingRules.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & CHARTS */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {/* Status Pie Chart */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Sesizări după Status</h3>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#3b82f6"} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Priority Bar Chart */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Distribuție Priorități Active</h3>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={priorityBarData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="Count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS MANAGEMENT */}
      {activeTab === "users" && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Administrare Utilizatori</h2>
          <div style={{ overflowX: "auto" }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nume</th>
                  <th>Email</th>
                  <th>Rol Curent</th>
                  <th>Status Cont</th>
                  <th>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        className="form-select"
                        style={{ width: "auto", fontSize: "0.8rem", padding: "4px 8px" }}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="CITIZEN">CITIZEN</option>
                        <option value="STAFF">STAFF</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: u.isActive ? "#dcfce7" : "#fee2e2", color: u.isActive ? "#166534" : "#dc2626" }}>
                        {u.isActive ? "Activ" : "Inactiv"}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleStatusToggle(u.id, u.isActive)}
                        className={`btn btn-sm ${u.isActive ? "btn-danger" : "btn-success"}`}
                      >
                        {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                        {u.isActive ? "Dezactivează" : "Activează"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES MANAGEMENT */}
      {activeTab === "categories" && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.25rem" }}>Categorii de Probleme</h2>
            <button onClick={() => setShowCatModal(true)} className="btn btn-primary btn-sm">
              <Plus size={16} /> Categorie Nouă
            </button>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Nume</th>
                <th>Slug</th>
                <th>Descriere</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700 }}>{c.name}</td>
                  <td style={{ color: "#2563eb" }}>{c.slug}</td>
                  <td>{c.description || "Fără descriere"}</td>
                  <td>
                    <span className="badge" style={{ backgroundColor: c.isActive ? "#dcfce7" : "#f1f5f9", color: c.isActive ? "#166534" : "#64748b" }}>
                      {c.isActive ? "Activă" : "Inactivă"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: INSTITUTIONS MANAGEMENT */}
      {activeTab === "institutions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1.25rem" }}>Instituții & Departamente</h2>
            <button onClick={() => setShowInstModal(true)} className="btn btn-primary btn-sm">
              <Plus size={16} /> Instituție Nouă
            </button>
          </div>

          {institutions.map((inst) => (
            <div key={inst.id} className="card" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid #f1f5f9", pb: "0.5rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", color: "#0f172a" }}>{inst.name}</h3>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Email: {inst.contactEmail || "Nespecificat"} • Termen Răspuns: {inst.responseDeadlineDays} zile</div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => { setTargetInstId(inst.id); setShowDeptModal(true); }} className="btn btn-secondary btn-sm">
                    + Adaugă Departament
                  </button>
                  <button onClick={() => { setTargetInstId(inst.id); setShowMemberModal(true); }} className="btn btn-secondary btn-sm">
                    + Adaugă Membru Staff
                  </button>
                </div>
              </div>

              {/* Departments */}
              <div style={{ marginBottom: "1rem" }}>
                <h4 style={{ fontSize: "0.9rem", color: "#475569", marginBottom: "0.5rem" }}>Departamente:</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {inst.departments?.map((d) => (
                    <span key={d.id} className="badge" style={{ backgroundColor: "#eff6ff", color: "#1e40af", padding: "6px 12px" }}>
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: ROUTING RULES */}
      {activeTab === "routing" && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.25rem" }}>Harta Responsabilității (Reguli de Rutare Automată)</h2>
            <button onClick={() => setShowRuleModal(true)} className="btn btn-primary btn-sm">
              <Plus size={16} /> Regulă Nouă
            </button>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Categorie</th>
                <th>Departament Responsabil</th>
                <th>Precedență</th>
                <th>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {routingRules.map((rule) => (
                <tr key={rule.id}>
                  <td style={{ fontWeight: 700 }}>{rule.category?.name}</td>
                  <td style={{ color: "#2563eb", fontWeight: 600 }}>{rule.department?.name} ({rule.department?.institution?.name})</td>
                  <td>{rule.precedence}</td>
                  <td>
                    <button onClick={() => handleDeleteRule(rule.id)} className="btn btn-danger btn-sm">
                      <Trash2 size={14} /> Șterge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals for Admin Actions */}
      <Modal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title="Categorie Nouă">
        <form onSubmit={handleCreateCategory}>
          <div className="form-group">
            <label className="form-label">Nume Categorie *</label>
            <input type="text" className="form-input" placeholder="ex: Drumuri și Gropi" value={catName} onChange={(e) => setCatName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Slug (opțional)</label>
            <input type="text" className="form-input" placeholder="ex: drumuri-gropi" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Descriere</label>
            <textarea className="form-textarea" rows={3} value={catDesc} onChange={(e) => setCatDesc(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" style={{ width: "100%" }}>Creează Categoria</button>
        </form>
      </Modal>

      <Modal isOpen={showInstModal} onClose={() => setShowInstModal(false)} title="Instituție Nouă">
        <form onSubmit={handleCreateInstitution}>
          <div className="form-group">
            <label className="form-label">Nume Instituție *</label>
            <input type="text" className="form-input" placeholder="ex: Primăria Municipiului" value={instName} onChange={(e) => setInstName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email de Contact</label>
            <input type="email" className="form-input" placeholder="contact@primaria.md" value={instEmail} onChange={(e) => setInstEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Termen Legal Răspuns (Zile)</label>
            <input type="number" className="form-input" value={instDeadline} onChange={(e) => setInstDeadline(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" style={{ width: "100%" }}>Creează Instituția</button>
        </form>
      </Modal>

      <Modal isOpen={showDeptModal} onClose={() => setShowDeptModal(false)} title="Adaugă Departament">
        <form onSubmit={handleAddDepartment}>
          <div className="form-group">
            <label className="form-label">Nume Departament *</label>
            <input type="text" className="form-input" placeholder="ex: Direcția Transport și Căi de Comunicație" value={deptName} onChange={(e) => setDeptName(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" style={{ width: "100%" }}>Adaugă Departament</button>
        </form>
      </Modal>

      <Modal isOpen={showMemberModal} onClose={() => setShowMemberModal(false)} title="Adaugă Membru Staff">
        <form onSubmit={handleAddMember}>
          <div className="form-group">
            <label className="form-label">Email Utilizator *</label>
            <input type="email" className="form-input" placeholder="staff@exemplu.md" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Rol în Instituție</label>
            <select className="form-select" value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
              <option value="HANDLER">HANDLER (Operator)</option>
              <option value="MANAGER">MANAGER (Director)</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-sm" style={{ width: "100%" }}>Adaugă Membru</button>
        </form>
      </Modal>

      <Modal isOpen={showRuleModal} onClose={() => setShowRuleModal(false)} title="Adaugă Regulă de Rutare Automată">
        <form onSubmit={handleCreateRule}>
          <div className="form-group">
            <label className="form-label">Categorie *</label>
            <select className="form-select" value={ruleCatId} onChange={(e) => setRuleCatId(e.target.value)} required>
              <option value="">Selectează Categorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Departament Responsabil *</label>
            <select className="form-select" value={ruleDeptId} onChange={(e) => setRuleDeptId(e.target.value)} required>
              <option value="">Selectează Departament</option>
              {institutions.flatMap((inst) =>
                (inst.departments || []).map((d) => (
                  <option key={d.id} value={d.id}>{inst.name} — {d.name}</option>
                ))
              )}
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-sm" style={{ width: "100%" }}>Salvează Regula</button>
        </form>
      </Modal>
    </div>
  );
}
