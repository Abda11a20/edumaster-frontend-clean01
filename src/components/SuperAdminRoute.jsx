import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

const SuperAdminRoute = ({ children }) => {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isSuperAdmin()) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default SuperAdminRoute
