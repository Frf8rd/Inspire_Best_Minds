import { Link, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Footer from './Footer'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user } = useAuth()
  return (
    <div className="shell collapsed">
      <Sidebar />
      {!user && <div className="top-auth"><Link className="btn btn-primary" to="/auth">Log in / Sign up</Link></div>}
      <main>
        <Outlet />
        <Footer />
      </main>
    </div>
  )
}
