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
  Shield,
  Contact,
  LineChart,
  Activity,
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

const navigationGroups = [
  {
    label: 'Gestão',
    items: [
      { name: 'Meu Painel', href: '/meu-painel', icon: LayoutDashboard },
      { name: 'Painel do Cliente', href: '/gestao/painel-cliente', icon: LayoutDashboard },
      { name: 'Visão Executiva', href: '/executive-dashboard', icon: LineChart },
      { name: 'Dashboard Geral', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Dashboard Financeiro', href: '/financial-dashboard', icon: LineChart },
      { name: 'Diagnóstico', href: '/diagnostics', icon: AlertTriangle },
      { name: 'Performance', href: '/performance', icon: Activity },
      { name: 'Auditoria de Prazos', href: '/deadline-audit', icon: Clock },
      { name: 'Contas Bancárias', href: '/management/bank-accounts', icon: Landmark },
    ],
  },
  {
    label: 'Operações',
    items: [
      { name: 'Lançamentos Financeiros', href: '/financial', icon: DollarSign },
      { name: 'Projetos', href: '/projects', icon: FolderKanban },
      { name: 'Cronograma', href: '/schedule', icon: CalendarDays },
      { name: 'Calendário', href: '/calendar', icon: CalendarIcon },
      { name: 'Orçamentos', href: '/quotes', icon: FileText },
      { name: 'Contratos', href: '/operations/contract-generator', icon: FileSignature },
    ],
  },
  {
    label: 'Cadastro',
    items: [
      { name: 'Projetistas', href: '/team', icon: Users },
      { name: 'Clientes', href: '/clients', icon: Briefcase },
      { name: 'Contatos', href: '/contacts', icon: Contact },
      { name: 'Equipamentos', href: '/equipment', icon: HardHat },
    ],
  },
  {
    label: 'GESTÃO ARQ/DOC',
    items: [
      { name: 'Biblioteca', href: '/files/library', icon: BookOpen },
      {
        name: 'POPs',
        href: '/files/pops',
        icon: FileCheck,
        allowedRoles: ['Administrador', 'Gerente de Projeto', 'Projetista'],
      },
      {
        name: 'Projetos Base',
        href: '/files/base-projects',
        icon: FileStack,
        allowedRoles: ['Administrador', 'Gerente de Projeto', 'Projetista'],
      },
      {
        name: 'Documentos Modelos',
        href: '/files/templates',
        icon: FileSpreadsheet,
        allowedRoles: ['Administrador', 'Gerente de Projeto', 'Projetista', 'Estagiário'],
      },
      { name: 'Cursos', href: '/files/courses', icon: GraduationCap },
    ],
  },
  {
    label: 'Governança e Admin',
    items: [
      {
        name: 'Visão Geral da Carteira',
        href: '/admin/analytics',
        icon: LineChart,
        adminOnly: true,
      },
      { name: 'Configurações', href: '/settings', icon: Settings },
      { name: 'Controle de Acesso', href: '/access-control', icon: Shield, adminOnly: true },
      { name: 'Auditoria Executiva', href: '/admin/audit-log', icon: History, adminOnly: true },
    ],
  },
]

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4 flex flex-row items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Home className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold tracking-tight text-sidebar-foreground">
            Tozzi Engenharia
          </span>
          <span className="text-xs text-sidebar-foreground/70">Plataforma</span>
        </div>
      </SidebarHeader>
      <SidebarSeparator className="bg-border" />
      <SidebarContent className="scrollbar-hide py-2">
        {navigationGroups.map((group, i) => (
          <SidebarGroup key={group.label} className={i !== 0 ? 'pt-0' : ''}>
            <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider px-2 mb-1">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  if (item.adminOnly && user?.role !== 'Administrador') return null
                  if (
                    (item as any).allowedRoles &&
                    (!user?.role || !(item as any).allowedRoles.includes(user.role))
                  )
                    return null

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
                            ? 'bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
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
        ))}
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
