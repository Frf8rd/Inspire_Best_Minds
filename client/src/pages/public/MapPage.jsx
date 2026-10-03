import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import CasesMap from '../../components/CasesMap'
import CaseCard from '../../components/CaseCard'
import StatusBadge from '../../components/StatusBadge'
import { useCases } from '../../hooks/useCases'
import { useAuth } from '../../context/AuthContext'
import { toggleVote } from '../../api/store'
import { CATEGORIES, STATUS, SEVERITY } from '../../utils/constants'
import { fmtDate } from '../../utils/format'

export default function MapPage() {
  const { cases, refresh } = useCases()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState('all')
  const [cat, setCat] = useState('all')
  const selectedId = params.get('case')
  const sel = cases.find((c) => c.id === selectedId)
  const list = useMemo(
    () => cases.filter((c) => (status === 'all' || c.status === status) && (cat === 'all' || c.category === cat)),
    [cases, status, cat])
  const select = (id) => setParams(id ? { case: id } : {})
  const vote = () => { toggleVote(sel.id, user.id); refresh() }

  return (
    <div className="map-page">
      <div className="map-main">
        <div className="row">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">All categories</option>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <Link className="btn btn-primary" to="/report">+ Report</Link>
        </div>
        <div className="map-box">
          <CasesMap cases={list} selectedId={selectedId} onSelect={select} flyTo={sel ? [sel.lat, sel.lng] : null} />
        </div>
      </div>
      <aside className="map-side">
        {sel ? (
          <div className="card detail">
            <button className="btn btn-sm" onClick={() => select(null)}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7M5 12h14" /></svg> All problems</button>
            {sel.photo && <img src={sel.photo} alt="" />}
            <h2>{sel.title}</h2>
            <StatusBadge status={sel.status} />
            <p>{sel.description || 'No description.'}</p>
            <p className="muted">{CATEGORIES[sel.category]} · Severity: {SEVERITY[sel.severity]}<br />
              Reported by {sel.authorName} on {fmtDate(sel.createdAt)}</p>
            {user ? (
              <button className={'btn' + (sel.votes.includes(user.id) ? ' btn-primary' : '')} onClick={vote}>
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3Zm0 0 5-8a3 3 0 0 1 2 4l-1 4h6a3 3 0 0 1 3 4l-1.5 6a3 3 0 0 1-3 2H7" /></svg> This affects me too ({sel.votes.length})
              </button>
            ) : (
              <p className="muted"><Link to="/auth" state={{ from: '/map' }}><u>Log in</u></Link> to confirm this problem ({sel.votes.length} confirmations).</p>
            )}
          </div>
        ) : (
          <>
            <strong>{list.length} problem{list.length === 1 ? '' : 's'}</strong>
            {list.map((c) => <CaseCard key={c.id} c={c} onClick={() => select(c.id)} />)}
            {!list.length && <p className="muted">No problems match these filters.</p>}
          </>
        )}
      </aside>
    </div>
  )
}
