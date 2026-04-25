import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useAuth } from '@/hooks/use-auth'

const routeModuleMap: Record<string, string> = {
  '/files/library': 'biblioteca',
  '/files/pops': 'pops',
  '/files/base-projects': 'projetos_base',
  '/files/templates': 'documentos_modelos',
  '/files/courses': 'cursos',
}

export function ModuleGuard() {
  const { moduleVisibility } = useSettingsStore()
  const location = useLocation()
  const { user } = useAuth()

  const defaultRedirect =
    user?.role === 'Administrador' || user?.role === 'Gerente de Projeto'
      ? '/dashboard'
      : '/meu-painel'

  const moduleId = routeModuleMap[location.pathname]

  if (moduleId) {
    if (moduleVisibility['gestao_arq_doc'] === false) {
      return <Navigate to={defaultRedirect} replace />
    }
    if (moduleVisibility[moduleId] === false) {
      return <Navigate to={defaultRedirect} replace />
    }
  } else if (location.pathname.startsWith('/files/')) {
    if (moduleVisibility['gestao_arq_doc'] === false && location.pathname !== '/files/favorites') {
      return <Navigate to={defaultRedirect} replace />
    }
  }

  return <Outlet />
}
