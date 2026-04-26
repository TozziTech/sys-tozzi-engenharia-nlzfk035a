import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  LogOut,
  FolderKanban,
  Users,
  Settings,
  Home,
  CalendarDays,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  History,
  DollarSign,
  HardHat,
  FileText,
  FileSignature,
  Landmark,
  Briefcase,
  Contact,
  LineChart,
  Activity,
  Shield,
  BookOpen,
  FileCheck,
  FileStack,
  FileSpreadsheet,
  GraduationCap,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'

const getNavigationGroups = () => [
  {
    label: 'Gestão Projetista',
    items: [
      {
        name: 'Meu Painel',
        href: '/meu-painel',
        icon: LayoutDashboard,
        allowedRoles: [
          'Administrador',
          'Gerente de Projeto',
          'Projetista',
          'Estagiário',
          'Visitante',
        ],
      },
    ],
  },
  {
    label: 'Gestão de Projetos',
    id: 'gestao_projetos',
    items: [
      { name: 'Dashboard geral', id: 'dashboard_geral', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Projetos', id: 'projetos', href: '/projects', icon: FolderKanban },
      {
        name: 'Painel do cliente',
        id: 'painel_cliente',
        href: '/gestao/painel-cliente',
        icon: LayoutDashboard,
      },
      { name: 'Diagnóstico', id: 'diagnostico', href: '/diagnostics', icon: AlertTriangle },
      { name: 'Performance', id: 'performance', href: '/performance', icon: Activity },
      { name: 'Cronograma', id: 'cronograma', href: '/schedule', icon: CalendarDays },
      { name: 'Auditoria de Prazos', id: 'auditoria_prazos', href: '/deadline-audit', icon: Clock },
      { name: 'Calendário', id: 'calendario', href: '/calendar', icon: CalendarIcon },
    ],
  },
  {
    label: 'Gestão Financeira',
    id: 'gestao_financeira',
    items: [
      {
        name: 'Dashboard Financeiro',
        href: '/financial-dashboard',
        icon: LineChart,
        allowedRoles: ['Administrador', 'Gerente de Projeto'],
      },
      { name: 'Lançamentos', id: 'lancamentos_financeiros', href: '/financial', icon: DollarSign },
      { name: 'Orçamentos', id: 'orcamentos', href: '/quotes', icon: FileText },
      {
        name: 'Contratos',
        id: 'contratos',
        href: '/operations/contract-generator',
        icon: FileSignature,
      },
      {
        name: 'Contas Bancárias',
        id: 'contas_bancarias',
        href: '/management/bank-accounts',
        icon: Landmark,
      },
    ],
  },
  {
    label: 'Cadastro',
    id: 'cadastro',
    items: [
      { name: 'Projetistas', id: 'projetistas', href: '/team', icon: Users },
      { name: 'Clientes', id: 'clientes', href: '/clients', icon: Briefcase },
      { name: 'Contatos', id: 'contatos', href: '/contacts', icon: Contact },
      { name: 'Equipamentos', id: 'equipamentos', href: '/equipment', icon: HardHat },
    ],
  },
  {
    label: 'GESTÃO ARQ/DOC',
    id: 'gestao_arq_doc',
    items: [
      { name: 'Biblioteca', id: 'biblioteca', href: '/files/library', icon: BookOpen },
      {
        name: 'POPs',
        id: 'pops',
        href: '/files/pops',
        icon: FileCheck,
      },
      {
        name: 'Projetos Base',
        id: 'projetos_base',
        href: '/files/base-projects',
        icon: FileStack,
      },
      {
        name: 'Documentos Modelos',
        id: 'documentos_modelos',
        href: '/files/templates',
        icon: FileSpreadsheet,
      },
      { name: 'Cursos', id: 'cursos', href: '/files/courses', icon: GraduationCap },
    ],
  },
  {
    label: 'Governança e Admin',
    id: 'governanca',
    items: [
      {
        name: 'Controle de Acesso',
        id: 'controle_acesso',
        href: '/admin/access-control',
        icon: Shield,
      },
      {
        name: 'Visão Geral da Carteira',
        id: 'visao_carteira',
        href: '/admin/analytics',
        icon: LineChart,
      },
      { name: 'Configurações', id: 'configuracoes', href: '/settings', icon: Settings },
      {
        name: 'Dashboard Executivo',
        id: 'dashboard_executivo',
        href: '/executive-dashboard',
        icon: LayoutDashboard,
        allowedRoles: ['Administrador'],
      },
      {
        name: 'Auditoria Executiva',
        id: 'auditoria',
        href: '/admin/audit-log',
        icon: History,
      },
    ],
  },
]

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { moduleVisibility } = useSettingsStore()
  const { canAccess } = usePermissions()

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  const groups = getNavigationGroups().filter((g) => {
    if (user?.role === 'Administrador') return true
    if ((g as any).id && moduleVisibility[(g as any).id] === false) return false
    if ((g as any).allowedRoles && (!user?.role || !(g as any).allowedRoles.includes(user.role))) {
      return false
    }
    return true
  })

  return (
    <Sidebar className="border-r border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <SidebarHeader className="p-4 flex flex-row items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-zinc-950 shadow-sm">
          <Home className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold tracking-tight text-zinc-100">Tozzi Engenharia</span>
          <span className="text-xs text-amber-500/80">Plataforma Premium</span>
        </div>
      </SidebarHeader>
      <SidebarSeparator className="bg-zinc-800" />
      <SidebarContent className="scrollbar-hide py-2">
        {groups.map((group, i) => {
          const visibleItems = group.items.filter((item) => {
            if (user?.role === 'Administrador') return true

            if ((item as any).id) {
              if (!canAccess((item as any).id)) return false
            } else {
              if (
                (item as any).allowedRoles &&
                (!user?.role || !(item as any).allowedRoles.includes(user.role))
              )
                return false
            }

            return true
          })

          if (visibleItems.length === 0) return null

          return (
            <SidebarGroup key={group.label} className={i !== 0 ? 'pt-0' : ''}>
              <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider px-2 mb-1">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const isActive =
                      location.pathname === item.href ||
                      (location.pathname === '/' && item.href === '/dashboard')

                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.name}
                          className={
                            isActive
                              ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 border-r-2 border-amber-500 rounded-none rounded-l-md'
                              : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
                          }
                        >
                          <Link to={item.href} className="flex items-center gap-3">
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-4 border-t border-border mt-auto">
        <div className="flex items-center justify-between px-2">
          <Label
            htmlFor="realtime-sync"
            className="text-xs text-sidebar-foreground/80 cursor-pointer"
          >
            Sync em Tempo Real
          </Label>
          <div className="flex items-center gap-2">
            <Switch
              id="realtime-sync"
              checked={useSettingsStore((s) => s.realtimeEnabled)}
              onCheckedChange={useSettingsStore((s) => s.toggleRealtime)}
              className="scale-75"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-sidebar-accent/50 p-2 shadow-sm">
          <Avatar className="h-9 w-9">
            <AvatarImage src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {user?.name || 'Usuário'}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/70">
              {user?.role || 'Cargo'}
            </span>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-red-500 hover:bg-red-500/10 hover:text-red-600 mt-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
