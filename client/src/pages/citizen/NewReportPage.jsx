import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CasesMap from '../../components/CasesMap'
import { useCases } from '../../hooks/useCases'
import { useAuth } from '../../context/AuthContext'
import { addCase } from '../../api/store'
import { compressImage } from '../../utils/image'
import { CATEGORIES, SEVERITY } from '../../utils/constants'

export default function NewReportPage() {
  const { user } = useAuth()
  const { cases } = useCases()
  const nav = useNavigate()
  const [f, setF] = useState({ title: '', description: '', category: 'pothole', severity: '2' })
  const [photo, setPhoto] = useState(null)
  const [pos, setPos] = useState(null)
  const [jump, setJump] = useState(null)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const onPhoto = async (e) => {
    const file = e.target.files[0]
    if (file) setPhoto(await compressImage(file))
  }
  const locate = () => navigator.geolocation?.getCurrentPosition(
    (p) => { const q = [p.coords.latitude, p.coords.longitude]; setPos(q); setJump(q) },
    () => setErr('Could not get your location. Click the map instead.'))

  const submit = (e) => {
    e.preventDefault()
    if (!pos) return setErr('Please choose the location on the map.')
    try {
      const c = addCase({ ...f, severity: Number(f.severity), lat: pos[0], lng: pos[1], photo, authorId: user.id, authorName: user.name })
      nav(`/map?case=${c.id}`)
    } catch { setErr('Could not save the report (browser storage is full). Try a smaller photo.') }
  }

  return (
    <div className="page">
      <h1>Report a problem</h1>
      <p className="muted">Add the details, then click the map to mark the exact spot.</p>
      <form className="report-grid" onSubmit={submit}>
        <div className="card form">
          <label className="field">Title<input required maxLength={80} value={f.title} onChange={set('title')} placeholder="e.g. Deep pothole on the crossing" /></label>
          <label className="field">Category
            <select value={f.category} onChange={set('category')}>
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></label>
          <label className="field">Severity
            <select value={f.severity} onChange={set('severity')}>
              {Object.entries(SEVERITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></label>
          <label className="field">Description<textarea rows={4} value={f.description} onChange={set('description')} /></label>
          <label className="field">Photo<input type="file" accept="image/*" capture="environment" onChange={onPhoto} /></label>
          {photo && <img className="preview" src={photo} alt="Preview" />}
        </div>
        <div className="card form">
          <div className="row between">
            <strong>Location {pos ? '✓' : '(required)'}</strong>
            <button type="button" className="btn btn-sm" onClick={locate}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2" /></svg> Use my location</button>
          </div>
          <div className="map-box small"><CasesMap cases={cases} onPick={setPos} picked={pos} flyTo={jump} /></div>
          {err && <div className="error">{err}</div>}
          <button className="btn btn-primary">Submit report</button>
        </div>
      </form>
    </div>
  )
}
