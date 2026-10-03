import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCases } from '../../hooks/useCases'
import { updateCase, deleteCase } from '../../api/store'
import { CATEGORIES, STATUS, SEVERITY } from '../../utils/constants'
import { fmtDate } from '../../utils/format'

export default function AdminPage() {
  const { cases, refresh } = useCases()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [cat, setCat] = useState('all')
  const count = (s) => cases.filter((c) => c.status === s).length
  const rows = cases.filter((c) =>
    (status === 'all' || c.status === status) && (cat === 'all' || c.category === cat) &&
    (c.title + c.authorName).toLowerCase().includes(q.toLowerCase()))

  const remove = (c) => { if (window.confirm(`Delete "${c.title}"?`)) { deleteCase(c.id); refresh() } }
  return (
    <div className="page wide">
      <h1>Admin dashboard</h1>
      <p className="muted">All reported problems. Change a status or remove spam.</p>
      <div className="stats four">
        <div className="card stat"><strong>{cases.length}</strong><span className="muted">Total</span></div>
        {['new', 'in_progress', 'resolved'].map((s) =>
          <div className="card stat" key={s}><strong>{count(s)}</strong><span className="muted">{STATUS[s].label}</span></div>)}
      </div>
      <div className="row">
        <input className="grow" placeholder="Search title or author…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Problem</th><th>Category</th><th>Severity</th><th>Confirms</th><th>Author</th><th>Date</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td><Link to={`/map?case=${c.id}`}><strong>{c.title}</strong></Link></td>
                <td>{CATEGORIES[c.category]}</td>
                <td>{SEVERITY[c.severity]}</td>
                <td>{c.votes.length}</td>
                <td>{c.authorName}</td>
                <td>{fmtDate(c.createdAt)}</td>
                <td>
                  <select value={c.status} onChange={(e) => { updateCase(c.id, { status: e.target.value }); refresh() }}>
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </td>
                <td><button className="btn btn-sm btn-danger" onClick={() => remove(c)} aria-label="Delete"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></svg></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="muted note">No problems match.</p>}
      </div>
    </div>
  )
}
