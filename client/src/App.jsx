import { Link, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/public/HomePage'
import MapPage from './pages/public/MapPage'
import AuthPage from './pages/public/AuthPage'
import NewReportPage from './pages/citizen/NewReportPage'
import ProfilePage from './pages/citizen/ProfilePage'
import AdminPage from './pages/admin/AdminPage'

const NotFound = () => (
  <div className="page"><h1>Page not found</h1><p><Link to="/"><u>Back to home</u></Link></p></div>
)

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="auth" element={<AuthPage />} />
        <Route path="report" element={<ProtectedRoute><NewReportPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="admin" element={<ProtectedRoute role="admin"><AdminPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
