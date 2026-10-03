import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="shell collapsed">
      <Sidebar />
      <main>
        <Outlet />
        <Footer />
      </main>
    </div>
  )
}
