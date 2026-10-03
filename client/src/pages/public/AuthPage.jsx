import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AuthPage() {
  const { user, login, register } = useAuth()
  const loc = useLocation()
  const [mode, setMode] = useState('login')
  const [err, setErr] = useState('')
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  if (user) return <Navigate to={loc.state?.from || '/'} replace />

  const submit = (e) => {
    e.preventDefault()
    setErr('')
    try {
      if (mode === 'login') login(f.email, f.password)
      else if (f.password.length < 6) setErr('Password must be at least 6 characters.')
      else register(f)
    } catch (ex) { setErr(ex.message) }
  }
  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <div className="tabs">
          <button className={mode === 'login' ? 'tab on' : 'tab'} onClick={() => { setMode('login'); setErr('') }}>Log in</button>
          <button className={mode === 'register' ? 'tab on' : 'tab'} onClick={() => { setMode('register'); setErr('') }}>Sign up</button>
        </div>
        <form className="form" onSubmit={submit}>
          {mode === 'register' && <label className="field">Full name<input required value={f.name} onChange={set('name')} /></label>}
          <label className="field">Email<input type="email" required value={f.email} onChange={set('email')} /></label>
          <label className="field">Password<input type="password" required value={f.password} onChange={set('password')} /></label>
          {err && <div className="error">{err}</div>}
          <button className="btn btn-primary">{mode === 'login' ? 'Log in' : 'Sign up'}</button>
        </form>
        <p className="muted note">Demo accounts: admin@demo.md / admin123 · citizen@demo.md / citizen123</p>
      </div>
    </div>
  )
}
