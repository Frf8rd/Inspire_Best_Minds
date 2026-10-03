import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCases } from '../../hooks/useCases'
import CaseCard from '../../components/CaseCard'
import { fmtDate } from '../../utils/format'

export default function ProfilePage() {
  const { user, update, logout } = useAuth()
  const { cases } = useCases()
  const nav = useNavigate()
  const [name, setName] = useState(user.name)
  const [saved, setSaved] = useState(false)
  const mine = cases.filter((c) => c.authorId === user.id)
  const confirmed = cases.filter((c) => c.votes.includes(user.id)).length

  const save = (e) => { e.preventDefault(); update({ name: name.trim() }); setSaved(true) }
  return (
    <div className="page">
      <h1>My profile</h1>
      <div className="profile-grid">
        <form className="card form" onSubmit={save}>
          <div className="avatar">{user.name[0]}</div>
          <label className="field">Name<input required value={name} onChange={(e) => { setName(e.target.value); setSaved(false) }} /></label>
          <label className="field">Email<input value={user.email} disabled /></label>
          <p className="muted">Role: <strong>{user.role}</strong> · Member since {fmtDate(user.createdAt)}</p>
          <button className="btn btn-primary">{saved ? 'Saved ✓' : 'Save changes'}</button>
          <button type="button" className="btn" onClick={() => { logout(); nav('/') }}>Log out</button>
        </form>
        <div>
          <div className="stats">
            <div className="card stat"><strong>{mine.length}</strong><span className="muted">Reports</span></div>
            <div className="card stat"><strong>{confirmed}</strong><span className="muted">Confirmations</span></div>
            <div className="card stat"><strong>{mine.filter((c) => c.status === 'resolved').length}</strong><span className="muted">Resolved</span></div>
          </div>
          <h2>My reports</h2>
          <div className="stack">
            {mine.map((c) => <CaseCard key={c.id} c={c} onClick={() => nav(`/map?case=${c.id}`)} />)}
            {!mine.length && <p className="muted">You haven't reported anything yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
