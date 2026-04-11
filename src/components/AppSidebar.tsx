import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileBarChart,
  Settings,
  Home,
  CalendarDays,
  AlertTriangle,
  Clock,
  History,
  Activity,
  ClipboardList,
  Wallet,
  DollarSign,
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
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useSettingsStore } from '@/stores/useSettingsStore'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Financeiro', href: '/financial', icon: DollarSign },
  { name: 'Projetos', href: '/projects', icon: FolderKanban },
  { name: 'Dashboard Financeiro', href: '/financeiro', icon: Wallet },
  { name: 'Equipe', href: '/team', icon: Users },
  { name: 'Atividades Recentes', href: '/activities', icon: Activity },
  { name: 'Cronograma', href: '/gantt', icon: CalendarDays },
  { name: 'Gargalos', href: '/bottlenecks', icon: AlertTriangle },
  { name: 'Timesheet', href: '/timesheet', icon: Clock },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Auditoria', href: '/history', icon: History },
  { name: 'Relatório de Pendências', href: '/pending-report', icon: ClipboardList },
  { name: 'Relatórios', href: '/reports', icon: FileBarChart },
  { name: 'Configurações', href: '/settings', icon: Settings },
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
          <span className="font-semibold tracking-tight text-slate-100">ArchBuild</span>
          <span className="text-xs text-slate-400">Engenharia & Arquitetura</span>
        </div>
      </SidebarHeader>
      <SidebarSeparator className="bg-slate-800" />
      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
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
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-4">
        <div className="flex items-center justify-between px-2">
          <Label htmlFor="realtime-sync" className="text-xs text-slate-300 cursor-pointer">
            Sync em Tempo Real
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">
              {useSettingsStore((s) => s.realtimeEnabled) ? 'Habilitado' : 'Desabilitado'}
            </span>
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
            <AvatarFallback>EC</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-slate-200">Eduardo Costa</span>
            <span className="truncate text-xs text-slate-400">Gestor de Projetos</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
