import { useAuth } from '@/hooks/use-auth'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

export function RoleGuard() {
  const { user } = useAuth()
  const location = useLocation()

  // Block access if user has no assigned role
  if (user && !user.role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md space-y-5 flex flex-col items-center">
          <div className="bg-amber-100 dark:bg-amber-900/20 p-5 rounded-full inline-flex mb-2">
            <ShieldAlert className="h-14 w-14 text-amber-600 dark:text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Aguardando Liberação</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Aguardando Liberação. Você ainda não possui um nível de acesso definido. Entre em
            contato com o administrador.
          </p>
        </div>
      </div>
    )
  }

  if (user?.role === 'Cliente' && !location.pathname.startsWith('/gestao/painel-cliente')) {
    return <Navigate to="/gestao/painel-cliente" replace />
  }

  return <Outlet />
}
