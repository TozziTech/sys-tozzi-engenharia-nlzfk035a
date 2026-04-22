import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

export function ManagerGuard() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center">Carregando...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'Administrador' && user.role !== 'Gerente de Projeto') {
    return <Navigate to="/meu-painel" replace />
  }

  return <Outlet />
}
