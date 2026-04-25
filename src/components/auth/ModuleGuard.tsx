import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

const routeModuleMap: Record<string, string> = {
  '/files/library': 'biblioteca',
  '/files/pops': 'pops',
  '/files/base-projects': 'projetos_base',
  '/files/templates': 'documentos_modelos',
  '/files/courses': 'cursos',
}

function RedirectWithToast({ to, message }: { to: string; message: string }) {
  const { toast } = useToast()
  useEffect(() => {
    toast({ title: 'Acesso Negado', description: message, variant: 'destructive' })
  }, [toast, message])
  return <Navigate to={to} replace />
}

export function ModuleGuard() {
  const { moduleVisibility } = useSettingsStore()
  const location = useLocation()
  const { user } = useAuth()
  const { canAccess } = usePermissions()

  const defaultRedirect =
    user?.role === 'Administrador' || user?.role === 'Gerente de Projeto'
      ? '/dashboard'
      : '/meu-painel'

  const moduleId = routeModuleMap[location.pathname]

  if (moduleId) {
    if (moduleVisibility['gestao_arq_doc'] === false) {
      return <Navigate to={defaultRedirect} replace />
    }
    if (!canAccess(moduleId)) {
      return (
        <RedirectWithToast
          to={defaultRedirect}
          message="Você não tem permissão para acessar este módulo."
        />
      )
    }
  } else if (location.pathname.startsWith('/files/')) {
    if (moduleVisibility['gestao_arq_doc'] === false && location.pathname !== '/files/favorites') {
      return <Navigate to={defaultRedirect} replace />
    }
  }

  return <Outlet />
}
