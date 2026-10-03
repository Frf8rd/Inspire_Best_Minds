import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const iconPaths = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15m6-12v15" /></>,
  add: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8m-4-4h8" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  login: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
  logout: <><path d="m14 17 5-5-5-5m5 5H7" /><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7" /></>,
}

function SidebarIcon({ name, size = 20 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {iconPaths[name]}
    </svg>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const items = [
    { to: '/', label: 'Home', icon: 'home' },
    { to: '/map', label: 'Problem map', icon: 'map' },
    { to: '/report', label: 'Report a problem', icon: 'add' },
    { to: '/profile', label: 'My profile', icon: 'user' },
  ]
  if (user?.role === 'admin') items.push({ to: '/admin', label: 'Admin dashboard', icon: 'shield' })

  return (
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">SMK</span><span className="label">Inspire Best Minds</span></div>
      {items.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} end={to === '/'} title={label}
          className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
          <SidebarIcon name={icon} /><span className="label">{label}</span>
        </NavLink>
      ))}
      <div className="sidebar-spacer" />
      {user ? (
        <button className="nav-item" title="Log out" onClick={() => { logout(); nav('/') }}>
          <SidebarIcon name="logout" /><span className="label">Log out ({user.name.split(' ')[0]})</span>
        </button>
      ) : null}
      {!user && (
        <Link className="nav-item sidebar-auth" to="/auth" title="Log in / Sign up">
          <SidebarIcon name="login" /><span className="label">Log in / Sign up</span>
        </Link>
      )}
    </aside>
  )
}
