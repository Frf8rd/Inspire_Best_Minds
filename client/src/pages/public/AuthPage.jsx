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

  const handleGoogle = () => {
    setErr('Google sign-in is coming soon. Please use the demo account or create a local account instead.')
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <div className="tabs">
          <button className={mode === 'login' ? 'tab on' : 'tab'} onClick={() => { setMode('login'); setErr('') }}>Log in</button>
          <button className={mode === 'register' ? 'tab on' : 'tab'} onClick={() => { setMode('register'); setErr('') }}>Sign up</button>
        </div>

        <button type="button" className="btn btn-google" onClick={handleGoogle} disabled aria-label="Google sign in is not available yet">
          <svg viewBox="0 0 24 24" className="google-icon" aria-hidden="true">
            <path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.7 4.7 0 0 1-2 3V20h3.2c1.9-1.7 3-4.1 3-7.8Z" fill="#4285F4"/>
            <path d="M12 21.1c2.7 0 4.9-.9 6.6-2.4l-3.2-2.5c-.9.6-2.1 1-3.4 1-2.6 0-4.9-1.8-5.7-4.2H.5v2.7A9.1 9.1 0 0 0 12 21.1Z" fill="#34A853"/>
            <path d="M6.3 15c-.4-.8-.6-1.7-.6-2.7s.2-1.9.6-2.7V6.9H2.8A9.1 9.1 0 0 0 1.7 12c0 1.5.4 2.9 1.1 4.1l3.5-2.9Z" fill="#FBBC05"/>
            <path d="M12 5.4c1.5 0 2.8.5 3.8 1.5l2.8-2.8A9.1 9.1 0 0 0 12 2.9 9.1 9.1 0 0 0 3.9 6.9L7.4 9.6c.8-2.4 3.1-4.2 5.6-4.2Z" fill="#EA4335"/>
          </svg>
          Google (coming soon)
        </button>

        <div className="auth-divider"><span>or</span></div>

        <form className="form" onSubmit={submit}>
          {mode === 'register' && <label className="field">Full name<input required maxLength={10} value={f.name} onChange={set('name')} /></label>}
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
