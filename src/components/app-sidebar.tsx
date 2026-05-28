import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  Users,
  Wallet,
  Landmark,
  HardHat,
  ClipboardCheck,
  AlertTriangle,
  Settings,
  LogOut,
  FileText,
  Contact,
  CircleDollarSign,
  ShieldCheck,
  Building2,
  Wrench,
  Library,
} from 'lucide-react'

export function AppSidebar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const pathname = location.pathname

  const role = user?.role as string

  const canSeeProjetos = [
    'Administrador',
    'Gerente de Projeto',
    'Projetista',
    'Estagiário',
  ].includes(role)
  const canSeeFinanceiro = ['Administrador', 'Gerente de Projeto'].includes(role)
  const canSeeObras = ['Administrador', 'Gerente de Projeto', 'Projetista'].includes(role)
  const canSeeAdmin = ['Administrador'].includes(role)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-14 items-center justify-center border-b px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <Building2 className="h-6 w-6 shrink-0" />
          <span className="font-bold text-lg truncate group-data-[collapsible=icon]:hidden">
            Sys-TOZZI
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {canSeeProjetos && (
          <SidebarGroup>
            <SidebarGroupLabel>Gestão de Projeto</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
                    <Link to="/dashboard">
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname.startsWith('/projects') || pathname.startsWith('/meus-projetos')
                    }
                  >
                    <Link to="/projects">
                      <FolderKanban />
                      <span>Projetos</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/gantt') || pathname.startsWith('/schedule')}
                  >
                    <Link to="/gantt">
                      <CalendarDays />
                      <span>Cronograma</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/team')}>
                    <Link to="/team">
                      <Users />
                      <span>Equipe</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/clients')}>
                    <Link to="/clients">
                      <Contact />
                      <span>Clientes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/equipments')}>
                    <Link to="/equipments">
                      <Wrench />
                      <span>Equipamentos</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {canSeeObras && (
          <SidebarGroup>
            <SidebarGroupLabel>Gestão de Obras</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/obras')}>
                    <Link to="/obras">
                      <HardHat />
                      <span>Gerenciamento de Obras</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/checklists')}>
                    <Link to="/checklists">
                      <ClipboardCheck />
                      <span>Checklists</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/apa')}>
                    <Link to="/apa">
                      <AlertTriangle />
                      <span>APA</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {canSeeFinanceiro && (
          <SidebarGroup>
            <SidebarGroupLabel>Gestão Financeira</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/financial-dashboard' || pathname === '/financeiro'}
                  >
                    <Link to="/financial-dashboard">
                      <Wallet />
                      <span>Dashboard Financeiro</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname.startsWith('/financial') && pathname !== '/financial-dashboard'
                    }
                  >
                    <Link to="/financial">
                      <CircleDollarSign />
                      <span>Lançamentos</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/management/bank-accounts')}
                  >
                    <Link to="/management/bank-accounts">
                      <Landmark />
                      <span>Contas Bancárias</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {canSeeProjetos && (
          <SidebarGroup>
            <SidebarGroupLabel>Biblioteca</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/files/library')}>
                    <Link to="/files/library">
                      <Library />
                      <span>Arquivos Base</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/operations/contract-generator')}
                  >
                    <Link to="/operations/contract-generator">
                      <FileText />
                      <span>Contratos</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {canSeeAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/users')}>
                    <Link to="/admin/users">
                      <Users />
                      <span>Usuários</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/audit')}>
                    <Link to="/audit">
                      <ShieldCheck />
                      <span>Auditoria</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/settings')}>
                    <Link to="/settings">
                      <Settings />
                      <span>Configurações</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
