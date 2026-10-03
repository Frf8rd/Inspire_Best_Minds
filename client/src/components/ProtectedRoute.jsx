import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth()
  const loc = useLocation()
  if (!user) return <Navigate to="/auth" replace state={{ from: loc.pathname }} />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}
