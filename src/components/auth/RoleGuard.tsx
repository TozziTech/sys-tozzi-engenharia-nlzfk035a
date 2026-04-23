import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

export function RoleGuard() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center">Carregando...</div>
  }

  if (!user) {
    return <Navigate to="/welcome" replace />
  }

  if (user.must_change_password && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  return <Outlet />
}
