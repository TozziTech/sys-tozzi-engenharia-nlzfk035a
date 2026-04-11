import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  Home,
  CalendarDays,
  AlertTriangle,
  History,
  DollarSign,
  HardHat,
  FileText,
  Briefcase,
  Shield,
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

const navigationGroups = [
  {
    label: 'Gestão',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Gargalos', href: '/bottlenecks', icon: AlertTriangle },
    ],
  },
  {
    label: 'Operações',
    items: [
      { name: 'Lançamentos Financeiros', href: '/financial', icon: DollarSign },
      { name: 'Projetos', href: '/projects', icon: FolderKanban },
      { name: 'Cronograma', href: '/schedule', icon: CalendarDays },
      { name: 'Orçamentos', href: '/quotes', icon: FileText },
    ],
  },
  {
    label: 'Cadastro',
    items: [
      { name: 'Projetistas', href: '/team', icon: Users },
      { name: 'Clientes', href: '/clients', icon: Briefcase },
      { name: 'Equipamentos', href: '/equipment', icon: HardHat },
    ],
  },
  {
    label: 'Governança e Admin',
    items: [
      { name: 'Configurações', href: '/settings', icon: Settings },
      { name: 'Acessos', href: '/access-control', icon: Shield },
      { name: 'Auditoria', href: '/audit', icon: History },
    ],
  },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar
      className="border-r border-slate-800"
      style={
        {
          '--sidebar-background': '222.2 84% 4.9%',
          '--sidebar-foreground': '210 40% 98%',
          '--sidebar-border': '217.2 32.6% 17.5%',
          '--sidebar-accent': '217.2 32.6% 17.5%',
          '--sidebar-accent-foreground': '210 40% 98%',
        } as React.CSSProperties
      }
    >
      <SidebarHeader className="p-4 flex flex-row items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-sm">
          <Home className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold tracking-tight text-slate-100">Tozzi Engenharia</span>
          <span className="text-xs text-slate-400">Plataforma</span>
        </div>
      </SidebarHeader>
      <SidebarSeparator className="bg-slate-800" />
      <SidebarContent className="scrollbar-hide py-2">
        {navigationGroups.map((group, i) => (
          <SidebarGroup key={group.label} className={i !== 0 ? 'pt-0' : ''}>
            <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
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
                            ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 hover:text-indigo-300'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
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
      <SidebarFooter className="p-4 space-y-4 border-t border-slate-800 mt-auto">
        <div className="flex items-center justify-between px-2">
          <Label htmlFor="realtime-sync" className="text-xs text-slate-300 cursor-pointer">
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
        <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 p-2 shadow-sm">
          <Avatar className="h-9 w-9">
            <AvatarImage src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-slate-200">Admin</span>
            <span className="truncate text-xs text-slate-400">Gestor</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
