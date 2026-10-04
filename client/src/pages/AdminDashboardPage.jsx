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
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";

const STATUS_COLORS = {
  NEW: "#45945b",
  IN_PROGRESS: "#9cba62",
  RESOLVED: "#277848",
  REJECTED: "#7d8b80",
  DUPLICATE: "#b0c5b3",
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

  const handleMembershipRoleChange = async (user, membership, role) => {
    try {
      await institutionsApi.addMember(membership.institution.id, {
        userId: user.id,
        departmentId: membership.department?.id,
        role,
      });
      addToast(`Rolul staff pentru ${user.name} a fost actualizat.`, "success");
      await loadAdminData();
    } catch (err) {
      addToast(err.message || "Eroare la actualizarea rolului staff.", "error");
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
    <main className="container-custom admin-dashboard">
      <header className="admin-hero">
        <div className="admin-hero-icon"><Shield size={25} /></div>
        <div className="admin-hero-copy">
          <span className="admin-eyebrow">Spațiu de administrare</span>
          <h1>Panou de Administrare</h1>
          <p>Gestionează utilizatorii, instituțiile, categoriile și regulile de rutare dintr-un singur loc.</p>
        </div>
        <div className="admin-hero-status"><span /> Sistem operațional</div>
      </header>

      {/* Admin Tabs */}
      <nav className="admin-tabs" role="tablist" aria-label="Secțiuni de administrare">
        <button type="button" role="tab" aria-selected={activeTab === "overview"} onClick={() => setActiveTab("overview")} className={`admin-tab ${activeTab === "overview" ? "is-active" : ""}`}>
          <BarChart3 size={16} /> Statistici Sistem
        </button>
        <button type="button" role="tab" aria-selected={activeTab === "users"} onClick={() => setActiveTab("users")} className={`admin-tab ${activeTab === "users" ? "is-active" : ""}`}>
          <Users size={16} /> Utilizatori <span>{users.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={activeTab === "categories"} onClick={() => setActiveTab("categories")} className={`admin-tab ${activeTab === "categories" ? "is-active" : ""}`}>
          <Layers size={16} /> Categorii <span>{categories.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={activeTab === "institutions"} onClick={() => setActiveTab("institutions")} className={`admin-tab ${activeTab === "institutions" ? "is-active" : ""}`}>
          <Building size={16} /> Instituții <span>{institutions.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={activeTab === "routing"} onClick={() => setActiveTab("routing")} className={`admin-tab ${activeTab === "routing" ? "is-active" : ""}`}>
          <GitMerge size={16} /> Reguli Rutare <span>{routingRules.length}</span>
        </button>
      </nav>

      {/* TAB 1: OVERVIEW & CHARTS */}
      {activeTab === "overview" && (
        <section className="admin-overview" role="tabpanel">
          <div className="admin-chart-grid">
            {/* Status Pie Chart */}
            <article className="card admin-chart-card">
              <div className="admin-chart-heading">
                <span className="admin-chart-icon"><Layers size={17} /></span>
                <div><h3>Sesizări după status</h3><p>Starea curentă a sesizărilor din sistem</p></div>
              </div>
              <div className="admin-chart-canvas">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#3b82f6"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "var(--admin-chart-tooltip-bg)", borderColor: "var(--admin-chart-border)", borderRadius: 10, color: "var(--admin-chart-text)" }} />
                    <Legend wrapperStyle={{ color: "var(--admin-chart-text)", fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>

            {/* Priority Bar Chart */}
            <article className="card admin-chart-card">
              <div className="admin-chart-heading">
                <span className="admin-chart-icon"><BarChart3 size={17} /></span>
                <div><h3>Priorități active</h3><p>Distribuția sesizărilor după prioritate</p></div>
              </div>
              <div className="admin-chart-canvas">
                <ResponsiveContainer>
                  <BarChart data={priorityBarData}>
                    <XAxis dataKey="name" tick={{ fill: "var(--admin-chart-tick)", fontSize: 11 }} axisLine={{ stroke: "var(--admin-chart-border)" }} tickLine={false} />
                    <YAxis tick={{ fill: "var(--admin-chart-tick)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--admin-chart-tooltip-bg)", borderColor: "var(--admin-chart-border)", borderRadius: 10, color: "var(--admin-chart-text)" }} />
                    <Bar dataKey="Count" fill="#45945b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>
        </section>
      )}

      {/* TAB 2: USERS MANAGEMENT */}
      {activeTab === "users" && (
        <section className="card admin-management-card" role="tabpanel">
          <div className="admin-section-heading">
            <div><h2>Administrare utilizatori</h2><p>Roluri de platformă și atribuții în echipele instituțiilor</p></div>
          </div>
          <div className="admin-table-wrap">
            <table className="custom-table admin-table">
              <thead>
                <tr>
                  <th>Nume</th>
                  <th>Email</th>
                  <th>Rol Curent</th>
                  <th>Roluri staff</th>
                  <th>Status Cont</th>
                  <th>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="admin-primary-cell">{u.name}</td>
                    <td className="admin-muted-cell">{u.email}</td>
                    <td>
                      <select
                        className="form-select admin-role-select"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="CITIZEN">CITIZEN</option>
                        <option value="STAFF">STAFF</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td>
                      {u.memberships?.length ? (
                        <div className="admin-user-memberships">
                          {u.memberships.map((membership) => (
                            <label className="admin-user-membership" key={membership.id}>
                              <span title={membership.institution.name}>{membership.institution.name}</span>
                              <select
                                className="form-select admin-membership-role-select"
                                value={membership.role}
                                aria-label={`Rolul lui ${u.name} la ${membership.institution.name}`}
                                onChange={(e) => handleMembershipRoleChange(u, membership, e.target.value)}
                              >
                                <option value="HANDLER">Staff operator</option>
                                <option value="MANAGER">Staff manager</option>
                              </select>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <span className="admin-no-membership">Fără rol staff</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge admin-status-badge ${u.isActive ? "is-active" : "is-inactive"}`}>
                        {u.isActive ? "Activ" : "Inactiv"}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleStatusToggle(u.id, u.isActive)}
                        className={`btn btn-sm admin-row-action ${u.isActive ? "is-danger" : "is-success"}`}
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
        </section>
      )}

      {/* TAB 3: CATEGORIES MANAGEMENT */}
      {activeTab === "categories" && (
        <section className="card admin-management-card" role="tabpanel">
          <div className="admin-section-heading">
            <div><h2>Categorii de probleme</h2><p>Grupează sesizările după domeniul lor</p></div>
            <button onClick={() => setShowCatModal(true)} className="btn btn-primary btn-sm admin-primary-action">
              <Plus size={16} /> Categorie Nouă
            </button>
          </div>

          <div className="admin-table-wrap"><table className="custom-table admin-table">
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
                  <td className="admin-primary-cell">{c.name}</td>
                  <td className="admin-code-cell">{c.slug}</td>
                  <td className="admin-muted-cell">{c.description || "Fără descriere"}</td>
                  <td>
                    <span className={`badge admin-status-badge ${c.isActive ? "is-active" : "is-inactive"}`}>
                      {c.isActive ? "Activă" : "Inactivă"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </section>
      )}

      {/* TAB 4: INSTITUTIONS MANAGEMENT */}
      {activeTab === "institutions" && (
        <section className="admin-institutions" role="tabpanel">
          <div className="admin-section-heading admin-institutions-heading">
            <div><h2>Instituții & Departamente</h2><p>Instituțiile responsabile și echipele lor</p></div>
            <button onClick={() => setShowInstModal(true)} className="btn btn-primary btn-sm admin-primary-action">
              <Plus size={16} /> Instituție Nouă
            </button>
          </div>

          {institutions.map((inst) => (
            <article key={inst.id} className="card admin-institution-card">
              <div className="admin-institution-heading">
                <div>
                  <h3>{inst.name}</h3>
                  <div className="admin-institution-meta">Email: {inst.contactEmail || "Nespecificat"} <span>•</span> Termen răspuns: {inst.responseDeadlineDays} zile</div>
                </div>
                <div className="admin-institution-actions">
                  <button onClick={() => { setTargetInstId(inst.id); setShowDeptModal(true); }} className="btn btn-secondary btn-sm admin-secondary-action">
                    + Adaugă Departament
                  </button>
                  <button onClick={() => { setTargetInstId(inst.id); setShowMemberModal(true); }} className="btn btn-secondary btn-sm admin-secondary-action">
                    + Adaugă Membru Staff
                  </button>
                </div>
              </div>

              {/* Departments */}
              <div className="admin-departments">
                <h4>Departamente</h4>
                <div className="admin-department-list">
                  {inst.departments?.map((d) => (
                    <span key={d.id} className="badge admin-department-badge">
                      {d.name}
                    </span>
                  ))}
                  {!inst.departments?.length && <span className="admin-empty-note">Nu sunt încă departamente adăugate.</span>}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* TAB 5: ROUTING RULES */}
      {activeTab === "routing" && (
        <section className="card admin-management-card" role="tabpanel">
          <div className="admin-section-heading">
            <div><h2>Harta responsabilității</h2><p>Reguli automate de repartizare a sesizărilor</p></div>
            <button onClick={() => setShowRuleModal(true)} className="btn btn-primary btn-sm admin-primary-action">
              <Plus size={16} /> Regulă Nouă
            </button>
          </div>

          <div className="admin-table-wrap"><table className="custom-table admin-table">
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
                  <td className="admin-primary-cell">{rule.category?.name}</td>
                  <td className="admin-code-cell">{rule.department?.name} <span className="admin-muted-cell">({rule.department?.institution?.name})</span></td>
                  <td><span className="admin-precedence">{rule.precedence}</span></td>
                  <td>
                    <button onClick={() => handleDeleteRule(rule.id)} className="btn btn-danger btn-sm admin-row-action is-danger">
                      <Trash2 size={14} /> Șterge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </section>
      )}

      {/* Modals for Admin Actions */}
      <Modal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title="Categorie Nouă" className="admin-modal">
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

      <Modal isOpen={showInstModal} onClose={() => setShowInstModal(false)} title="Instituție Nouă" className="admin-modal">
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

      <Modal isOpen={showDeptModal} onClose={() => setShowDeptModal(false)} title="Adaugă Departament" className="admin-modal">
        <form onSubmit={handleAddDepartment}>
          <div className="form-group">
            <label className="form-label">Nume Departament *</label>
            <input type="text" className="form-input" placeholder="ex: Direcția Transport și Căi de Comunicație" value={deptName} onChange={(e) => setDeptName(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" style={{ width: "100%" }}>Adaugă Departament</button>
        </form>
      </Modal>

      <Modal isOpen={showMemberModal} onClose={() => setShowMemberModal(false)} title="Adaugă Membru Staff" className="admin-modal">
        <form onSubmit={handleAddMember}>
          <div className="form-group">
            <label className="form-label">Email Utilizator *</label>
            <input type="email" className="form-input" placeholder="staff@exemplu.md" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Rol în Instituție</label>
            <select className="form-select" value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
              <option value="HANDLER">Staff operator</option>
              <option value="MANAGER">Staff manager</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-sm" style={{ width: "100%" }}>Adaugă Membru</button>
        </form>
      </Modal>

      <Modal isOpen={showRuleModal} onClose={() => setShowRuleModal(false)} title="Adaugă Regulă de Rutare Automată" className="admin-modal">
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
    </main>
  );
}
