import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCases } from '../../hooks/useCases'
import CaseCard from '../../components/CaseCard'
import CasesMap from '../../components/CasesMap'
import { fmtDate } from '../../utils/format'
import { deleteCase, updateCase } from '../../api/store'
import { compressImage } from '../../utils/image'

export default function ProfilePage() {
  const { user, update, logout } = useAuth()
  const { cases, refresh } = useCases()
  const nav = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')
  const [form, setForm] = useState({ name: user.name || '', email: user.email || '', password: '', confirmPassword: '' })
  const [editingCaseId, setEditingCaseId] = useState(null)
  const [reportForm, setReportForm] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [verifyDialog, setVerifyDialog] = useState(false)
  const [photoDialog, setPhotoDialog] = useState(false)
  const [photoDraft, setPhotoDraft] = useState(user.photo || '')
  const [photoError, setPhotoError] = useState('')

  const mine = cases.filter((c) => c.authorId === user.id)
  const confirmed = cases.filter((c) => c.votes.includes(user.id)).length

  const onChange = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value })
    setSaved(false)
    setErr('')
  }

  const save = (e) => {
    e.preventDefault()
    setErr('')

    try {
      const patch = {}
      const nextName = form.name.trim()
      if (!nextName) throw new Error('Username cannot be empty.')

      patch.name = nextName
      if (form.email.trim().toLowerCase() !== user.email.toLowerCase()) patch.email = form.email.trim().toLowerCase()
      const nextPassword = form.password.trim()
      const confirmPassword = form.confirmPassword.trim()
      if (nextPassword || confirmPassword) {
        if (!nextPassword) throw new Error('Enter a new password to confirm it.')
        if (nextPassword !== confirmPassword) throw new Error('Passwords do not match.')
        patch.password = nextPassword
      }

      const updatedUser = update(patch)
      setForm({
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        password: '',
        confirmPassword: '',
      })
      setIsEditing(false)
      setSaved(true)
    } catch (ex) {
      setErr(ex.message)
    }
  }

  const openCaseEditor = (c) => {
    setEditingCaseId(c.id)
    setReportForm({
      title: c.title || '',
      description: c.description || '',
      photo: c.photo || '',
      lat: c.lat ?? null,
      lng: c.lng ?? null,
    })
    setErr('')
  }

  const onReportChange = (key) => (e) => setReportForm({ ...reportForm, [key]: e.target.value })

  const onReportPhoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setReportForm({ ...reportForm, photo: await compressImage(file) })
  }

  const saveReport = (e) => {
    e.preventDefault()

    if (!reportForm?.title.trim()) return setErr('Title is required.')
    if (!reportForm?.description.trim()) return setErr('Description is required.')
    if (reportForm?.lat == null || reportForm?.lng == null) return setErr('Please choose a location.')

    updateCase(editingCaseId, {
      title: reportForm.title.trim(),
      description: reportForm.description.trim(),
      photo: reportForm.photo || '',
      lat: reportForm.lat,
      lng: reportForm.lng,
    })
    refresh()
    setEditingCaseId(null)
    setReportForm(null)
    setErr('')
  }

  const deleteReport = (id) => {
    const report = mine.find((c) => c.id === id)
    setDeleteTarget({ id, title: report?.title || 'this report' })
  }

  const confirmDelete = () => {
    if (!deleteTarget) return

    deleteCase(deleteTarget.id)
    refresh()
    if (editingCaseId === deleteTarget.id) {
      setEditingCaseId(null)
      setReportForm(null)
    }
    setDeleteTarget(null)
  }

  const useMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setReportForm({ ...reportForm, lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setErr('Could not detect your location. Click the map instead.'),
    )
  }

  const onPhotoDialogChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setPhotoDraft(await compressImage(file))
      setPhotoError('')
    } catch {
      setPhotoError('Could not load that image. Please choose another file.')
    }
  }

  const saveProfilePhoto = () => {
    try {
      update({ photo: photoDraft || null })
      setPhotoDialog(false)
      setPhotoError('')
    } catch {
      setPhotoError('Could not save the photo. Try a smaller image.')
    }
  }

  const requestVerification = () => {
    update({ verificationStatus: 'pending', isVerified: false })
    setVerifyDialog(true)
  }

  const verificationLabel = user.verificationStatus === 'verified' ? 'Verified account' : user.verificationStatus === 'pending' ? 'Verification pending' : 'Unverified account'

  return (
    <div className="page profile-page">
      <section className="profile-hero card">
        <div className="profile-hero__identity">
          <button type="button" className="avatar-button" onClick={() => setPhotoDialog(true)} aria-label="Change profile photo">
            {user.photo ? (
              <img src={user.photo} alt={`${user.name || 'User'} profile`} className="avatar-image" />
            ) : (
              <span className="avatar-fallback">{(user.name || 'U').charAt(0).toUpperCase()}</span>
            )}
          </button>

          <div className="profile-header__info">
            <p className="eyebrow">Account</p>
            <h1>{user.name}</h1>
            <p className="muted">Member since {fmtDate(user.createdAt)}</p>
          </div>
        </div>

        <div className="profile-hero__actions">
          <span className="profile-badge">{verificationLabel}</span>
          <button type="button" className="btn btn-brand" onClick={() => setIsEditing(true)}>Edit profile</button>
          <button type="button" className="btn" onClick={() => { logout(); nav('/') }}>Log out</button>
        </div>
      </section>

      <div className="profile-layout">
        <aside className="card profile-sidebar">
          <div className="section-head compact">
            <h2>Profile details</h2>
            <button type="button" className="btn btn-sm btn-brand" onClick={requestVerification}>Verify</button>
          </div>

          {isEditing ? (
            <form className="form" onSubmit={save}>
              <label className="field">Username<input required value={form.name} onChange={onChange('name')} /></label>
              <label className="field">Email<input type="email" required value={form.email} onChange={onChange('email')} /></label>
              <label className="field">New password<input type="password" autoComplete="new-password" value={form.password} placeholder="Leave blank to keep current password" onChange={onChange('password')} /></label>
              <label className="field">Confirm new password<input type="password" autoComplete="new-password" value={form.confirmPassword} onChange={onChange('confirmPassword')} /></label>
              {err && <div className="error">{err}</div>}
              <div className="row between">
                <button className="btn btn-brand">{saved ? 'Saved ✓' : 'Save changes'}</button>
                <button type="button" className="btn" onClick={() => { setIsEditing(false); setErr(''); setForm({ name: user.name || '', email: user.email || '', password: '', confirmPassword: '' }); }}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="profile-summary">
              <div className="profile-summary__row">
                <span className="muted">Username</span>
                <strong>{user.name}</strong>
              </div>
              <div className="profile-summary__row">
                <span className="muted">Email</span>
                <strong>{user.email}</strong>
              </div>
              <div className="profile-summary__row">
                <span className="muted">Role</span>
                <strong>{user.role}</strong>
              </div>
              <div className="profile-summary__row">
                <span className="muted">Member since</span>
                <strong>{fmtDate(user.createdAt)}</strong>
              </div>
            </div>
          )}

        </aside>

        <main className="profile-main">
          <div className="stats-grid">
            <div className="card stat"><strong>{mine.length}</strong><span className="muted">Reports</span></div>
            <div className="card stat"><strong>{confirmed}</strong><span className="muted">Confirmations</span></div>
            <div className="card stat"><strong>{mine.filter((c) => c.status === 'resolved').length}</strong><span className="muted">Resolved</span></div>
          </div>

          <section className="card profile-reports">
            <div className="section-head">
              <h2>My reports</h2>
              <button type="button" className="btn btn-sm" onClick={() => nav('/report')}>New report</button>
            </div>

            <div className="stack">
              {mine.map((c) => (
                <div key={c.id} className="report-item">
                  <div className="report-item__actions">
                    <CaseCard c={c} onClick={() => nav(`/map?case=${c.id}`)} />
                    <div className="report-item__buttons">
                      <button type="button" className="btn btn-sm" onClick={() => openCaseEditor(c)}>Edit</button>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => deleteReport(c.id)}>Delete</button>
                    </div>
                  </div>

                  {editingCaseId === c.id && reportForm && (
                    <form className="card form report-editor" onSubmit={saveReport}>
                      <label className="field">Report name<input value={reportForm.title} onChange={onReportChange('title')} /></label>
                      <label className="field">Description<textarea rows={4} value={reportForm.description} onChange={onReportChange('description')} /></label>
                      <label className="field">Photo<input type="file" accept="image/*" onChange={onReportPhoto} /></label>
                      {reportForm.photo && <img className="preview" src={reportForm.photo} alt="Report preview" />}
                      <div className="row between">
                        <strong>Location {reportForm.lat != null && reportForm.lng != null ? '✓' : '(required)'}</strong>
                        <button type="button" className="btn btn-sm" onClick={useMyLocation}>Use my location</button>
                      </div>
                      <div className="map-box small"><CasesMap cases={cases} onPick={(pos) => setReportForm({ ...reportForm, lat: pos[0], lng: pos[1] })} picked={reportForm.lat != null && reportForm.lng != null ? [reportForm.lat, reportForm.lng] : null} /></div>
                      {err && <div className="error">{err}</div>}
                      <div className="row between">
                        <button className="btn btn-primary">Save report</button>
                        <button type="button" className="btn" onClick={() => { setEditingCaseId(null); setReportForm(null); setErr('') }}>Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
              {!mine.length && <p className="muted">You haven't reported anything yet.</p>}
            </div>
          </section>
        </main>
      </div>

      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Delete this report?</h3>
            <p>“{deleteTarget.title}” will be permanently removed. This action cannot be undone.</p>
            <div className="row between">
              <button type="button" className="btn" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>Delete report</button>
            </div>
          </div>
        </div>
      )}

      {verifyDialog && (
        <div className="modal-backdrop" onClick={() => setVerifyDialog(false)}>
          <div className="modal-card modal-card--small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card__icon">✓</div>
            <h3>Verification started</h3>
            <p>We sent a confirmation email to <strong>{user.email}</strong>. Please check your inbox and follow the instructions to finish verification.</p>
            <div className="modal-card__actions">
              <button type="button" className="btn btn-brand" onClick={() => setVerifyDialog(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {photoDialog && (
        <div className="modal-backdrop" onClick={() => setPhotoDialog(false)}>
          <section className="modal-card photo-dialog" role="dialog" aria-modal="true" aria-labelledby="photo-dialog-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="photo-dialog-title">Change profile photo</h3>
            <p>Choose a photo to use on your profile.</p>
            <div className="photo-dialog__preview">
              {photoDraft ? <img src={photoDraft} alt="New profile photo preview" /> : <div className="avatar avatar--large">{(user.name || 'U').charAt(0).toUpperCase()}</div>}
            </div>
            <label className="btn photo-dialog__choose">Choose photo<input type="file" accept="image/*" onChange={onPhotoDialogChange} /></label>
            {user.photo && <button type="button" className="btn btn-danger" onClick={() => setPhotoDraft('')}>Remove current photo</button>}
            {photoError && <div className="error">{photoError}</div>}
            <div className="row between photo-dialog__actions">
              <button type="button" className="btn" onClick={() => setPhotoDialog(false)}>Cancel</button>
              <button type="button" className="btn btn-brand" onClick={saveProfilePhoto}>Save photo</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
