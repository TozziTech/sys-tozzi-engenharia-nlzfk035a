import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import useProjectStore from '@/stores/useProjectStore'

const routeMap: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projetos',
  'meus-projetos': 'Meus Projetos',
  'designer-panel': 'Meu Painel',
  'client-dashboard': 'Painel do Cliente',
  'financial-dashboard': 'Financeiro',
  'executive-dashboard': 'Executivo',
  'deadline-audit': 'Auditoria',
  settings: 'Configurações',
  profile: 'Meu Perfil',
  team: 'Equipe',
  clients: 'Clientes',
  contacts: 'Contatos',
  equipments: 'Equipamentos',
  activities: 'Atividades',
  quotes: 'Orçamentos',
  reports: 'Relatórios',
  checklists: 'Checklists',
  apa: 'APA',
  audit: 'Auditoria',
}

export function AppBreadcrumbs() {
  const location = useLocation()
  const { projects } = useProjectStore()

  const pathnames = location.pathname.split('/').filter((x) => x)

  if (pathnames.length === 0) return null

  return (
    <div className="flex items-center text-sm text-muted-foreground mb-2 overflow-x-auto whitespace-nowrap pb-1 scrollbar-hide">
      <Link
        to="/"
        className="hover:text-foreground transition-colors flex items-center gap-1 shrink-0"
      >
        <Home className="h-4 w-4" />
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1

        let displayName = routeMap[name] || name

        // Check if it's a project ID
        if (name.length > 10) {
          const project = projects.find((p) => p.id === name)
          if (project) {
            displayName = project.name
          }
        }

        // Special handling for disciplines
        if (pathnames[index - 1] === 'disciplines') {
          displayName = 'Disciplina'
        }
        if (name === 'disciplines') return null

        return (
          <div key={name} className="flex items-center shrink-0">
            <ChevronRight className="h-4 w-4 mx-1 opacity-50 shrink-0" />
            {isLast ? (
              <span className="font-medium text-foreground">{displayName}</span>
            ) : (
              <Link to={routeTo} className="hover:text-foreground transition-colors">
                {displayName}
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}
