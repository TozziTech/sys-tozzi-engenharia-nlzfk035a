import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

const routeModuleMap: Record<string, string> = {
  '/dashboard': 'projetos',
  '/projects': 'projetos',
  '/gestao/painel-cliente': 'projetos',
  '/diagnostics': 'projetos',
  '/bottlenecks': 'projetos',
  '/performance': 'projetos',
  '/schedule': 'cronograma',
  '/gantt': 'cronograma',
  '/deadline-audit': 'cronograma',
  '/calendar': 'calendario',
  '/financial-dashboard': 'lancamentos_financeiros',
  '/financial': 'lancamentos_financeiros',
  '/financeiro': 'lancamentos_financeiros',
  '/quotes': 'orcamentos',
  '/operations/contract-generator': 'contratos',
  '/management/bank-accounts': 'contas_bancarias',
  '/team': 'projetistas',
  '/team/new': 'projetistas',
  '/clients': 'clientes',
  '/contacts': 'contatos',
  '/equipments': 'equipamentos',
  '/equipment': 'equipamentos',
  '/settings': 'configuracoes',
  '/reports': 'projetos',
  '/timesheet': 'projetistas',
  '/history': 'auditoria',
  '/activities': 'projetos',
  '/pending-report': 'projetos',
  '/gestao-central': 'projetos',
  '/audit': 'auditoria',
  '/admin/access-control': 'controle_acesso',
  '/audit-logs': 'auditoria',
  '/admin/audit-log': 'auditoria',
  '/admin/audit-logs': 'auditoria',
  '/gestao/admin/documentos': 'gestao_arq_doc',
  '/admin/analytics': 'visao_carteira',
  '/executive-dashboard': 'visao_carteira',
  '/admin/users': 'controle_acesso',
  '/files/library': 'biblioteca',
  '/files/pops': 'pops',
  '/files/base-projects': 'projetos_base',
  '/files/templates': 'documentos_modelos',
  '/files/courses': 'cursos',
}

const parentMap: Record<string, string> = {
  biblioteca: 'gestao_arq_doc',
  pops: 'gestao_arq_doc',
  projetos_base: 'gestao_arq_doc',
  documentos_modelos: 'gestao_arq_doc',
  cursos: 'gestao_arq_doc',
  projetos: 'gestao_projetos',
  cronograma: 'gestao_projetos',
  calendario: 'gestao_projetos',
  lancamentos_financeiros: 'gestao_financeira',
  orcamentos: 'gestao_financeira',
  contratos: 'gestao_financeira',
  contas_bancarias: 'gestao_financeira',
  projetistas: 'cadastro',
  clientes: 'cadastro',
  contatos: 'cadastro',
  equipamentos: 'cadastro',
  controle_acesso: 'governanca',
  visao_carteira: 'governanca',
  configuracoes: 'governanca',
  auditoria: 'governanca',
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

  let defaultRedirect = '/meu-painel'
  if (user?.role === 'Cliente') defaultRedirect = '/gestao/painel-cliente'
  else if (canAccess('projetos')) defaultRedirect = '/dashboard'

  let moduleId = routeModuleMap[location.pathname]

  if (!moduleId) {
    if (location.pathname.startsWith('/projects/')) moduleId = 'projetos'
    else if (location.pathname.startsWith('/team/')) moduleId = 'projetistas'
    else if (location.pathname.startsWith('/files/')) {
      if (location.pathname !== '/files/favorites') moduleId = 'gestao_arq_doc' // fallback for other files
    } else if (location.pathname.startsWith('/gestao/painel-cliente/')) moduleId = 'projetos'
  }

  if (moduleId) {
    if (user?.role === 'Administrador') {
      return <Outlet />
    }

    const parentId = parentMap[moduleId]
    if (parentId && moduleVisibility[parentId] === false) {
      return <Navigate to={defaultRedirect} replace />
    }
    if (moduleId === 'gestao_arq_doc' && moduleVisibility['gestao_arq_doc'] === false) {
      return <Navigate to={defaultRedirect} replace />
    }
    if (moduleId !== 'gestao_arq_doc' && !canAccess(moduleId)) {
      return (
        <RedirectWithToast
          to={defaultRedirect}
          message="Você não tem permissão para acessar este módulo."
        />
      )
    }
  }

  return <Outlet />
}
