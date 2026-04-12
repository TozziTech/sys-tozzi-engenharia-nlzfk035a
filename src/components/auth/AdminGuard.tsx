import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

export function AdminGuard() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user || user.role !== 'Administrador') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
