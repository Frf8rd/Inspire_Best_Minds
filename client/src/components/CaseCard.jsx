import StatusBadge from './StatusBadge'
import { CATEGORIES } from '../utils/constants'
import { fmtDate } from '../utils/format'

export default function CaseCard({ c, onClick, active }) {
  return (
    <button className={'case-card' + (active ? ' active' : '')} onClick={onClick}>
      {c.photo ? <img src={c.photo} alt="" /> : <div className="thumb">{CATEGORIES[c.category][0]}</div>}
      <div className="case-card-text">
        <strong>{c.title}</strong>
        <span className="muted">{CATEGORIES[c.category]} · {fmtDate(c.createdAt)}</span>
      </div>
      <StatusBadge status={c.status} />
    </button>
  )
}
