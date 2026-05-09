import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ProjectProvider } from '@/stores/useProjectStore'
import Dashboard from './pages/Dashboard'
import ClientDashboard from './pages/ClientDashboard'
import ClientProjectDetails from './pages/ClientProjectDetails'
import BankAccounts from './pages/BankAccounts'
import ExecutiveDashboard from './pages/ExecutiveDashboard'
import DeadlineAudit from './pages/DeadlineAudit'
import DesignerPanel from './pages/DesignerPanel'
import MeuPainel from './pages/MeuPainel'
import { ThemeProvider } from './components/ThemeProvider'
import Projects from './pages/Projects'
import { useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

import ProjectDetails from './pages/ProjectDetails'
import DisciplineDetails from './pages/DisciplineDetails'
import { RealtimeSync } from './components/RealtimeSync'
import Financial from './pages/Financial'
import FinancialDashboard from './pages/FinancialDashboard'
import Clients from './pages/Clients'
import Contacts from './pages/Contacts'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Gantt from './pages/Gantt'
import ProjectCalendar from './pages/ProjectCalendar'
import ResourceAllocation from './pages/ResourceAllocation'
import Timesheet from './pages/Timesheet'
import History from './pages/History'
import Team from './pages/Team'
import TeamNew from './pages/TeamNew'
import TeamEdit from './pages/TeamEdit'
import Activities from './pages/Activities'
import PendingReport from './pages/PendingReport'
import Quotes from './pages/Quotes'
import ContractGenerator from './pages/ContractGenerator'
import GestaoCentral from './pages/GestaoCentral'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import Equipments from './pages/Equipments'
import Audit from './pages/Audit'
import AdminDocuments from './pages/admin/AdminDocuments'
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard'
import EfficiencyReports from './pages/EfficiencyReports'
import AdminUsers from './pages/admin/AdminUsers'
import DisciplineTemplates from './pages/DisciplineTemplates'
import AccessControl from './pages/AccessControl'
import ChecklistTemplates from './pages/ChecklistTemplates'
import NewChecklist from './pages/NewChecklist'
import ChecklistHistory from './pages/ChecklistHistory'
import Meetings from './pages/admin/Meetings'
import MeetingTemplates from './pages/admin/MeetingTemplates'
import MeetingTemplateDetails from './pages/admin/MeetingTemplateDetails'
import MeetingDetails from './pages/admin/MeetingDetails'
import MeetingInProgress from './pages/admin/MeetingInProgress'
import DocumentResourcesPage from './pages/files/DocumentResourcesPage'
import ApaPage from './pages/apa/ApaPage'
import ChecklistsPage from './pages/checklists/ChecklistsPage'
import FavoriteDocumentsPage from './pages/files/FavoriteDocumentsPage'
import { AuthProvider, useAuth } from './hooks/use-auth'
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { RoleGuard } from './components/auth/RoleGuard'
import { ThemeColorInjector } from './components/ThemeColorInjector'
import { ThemeSync } from './components/ThemeSync'
import { ModuleGuard } from './components/auth/ModuleGuard'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Welcome from './pages/Welcome'
import ChangePassword from './pages/ChangePassword'
import PublicReportView from './pages/PublicReportView'

function HomeRoute() {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (user?.must_change_password) return <Navigate to="/change-password" replace />

  const role = user?.role

  if (role === 'Administrador' || role === 'Gerente de Projeto') {
    return <Navigate to="/dashboard" replace />
  }

  if (role === 'Projetista' || role === 'Estagiário') {
    return <Navigate to="/designer-panel" replace />
  }

  if (role === 'Cliente' || role === 'Visitante') {
    return <Navigate to="/client-dashboard" replace />
  }

  // Fallback for undefined or unrecognized role
  return <Navigate to="/designer-panel" replace />
}

const RootProviders = () => (
  <TooltipProvider>
    <RealtimeSync />
    <KeyboardShortcuts />
    <Toaster />
    <Sonner />
    <Outlet />
  </TooltipProvider>
)

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootProviders />}>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/report/view/:token" element={<PublicReportView />} />
      <Route element={<RoleGuard />}>
        <Route path="/change-password" element={<ChangePassword />} />
        <Route element={<Layout />}>
          <Route element={<ModuleGuard />}>
            {/* Public authenticated routes */}
            <Route path="/" element={<HomeRoute />} />
            <Route path="/meu-painel" element={<MeuPainel />} />
            <Route path="/designer-panel" element={<DesignerPanel />} />
            <Route path="/meus-projetos" element={<Projects filterOnlyMine />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/projects/:id/disciplines/:moduleId" element={<DisciplineDetails />} />
            <Route path="/gestao/painel-cliente" element={<ClientDashboard />} />
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/gestao/painel-cliente/:id" element={<ClientProjectDetails />} />

            {/* Document & File Routes */}
            <Route
              path="/files/library"
              element={<DocumentResourcesPage category="Biblioteca" title="Biblioteca" />}
            />
            <Route
              path="/files/pops"
              element={<DocumentResourcesPage category="POPs" title="POPs" />}
            />
            <Route
              path="/files/base-projects"
              element={<DocumentResourcesPage category="Projetos Base" title="Projetos Base" />}
            />
            <Route
              path="/files/templates"
              element={
                <DocumentResourcesPage category="Documentos Modelos" title="Documentos Modelos" />
              }
            />
            <Route
              path="/files/courses"
              element={<DocumentResourcesPage category="Cursos" title="Cursos" />}
            />
            <Route path="/files/favorites" element={<FavoriteDocumentsPage />} />

            {/* Module-Guarded Routes (Settings, Admin, Managers, etc) */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/executive-dashboard" element={<ExecutiveDashboard />} />
            <Route path="/financial-dashboard" element={<FinancialDashboard />} />
            <Route
              path="/diagnostics"
              element={<Navigate to="/dashboard?tab=diagnostico" replace />}
            />
            <Route
              path="/bottlenecks"
              element={<Navigate to="/dashboard?tab=diagnostico" replace />}
            />
            <Route path="/deadline-audit" element={<DeadlineAudit />} />
            <Route path="/management/bank-accounts" element={<BankAccounts />} />
            <Route path="/financial" element={<Financial />} />
            <Route path="/financeiro" element={<Navigate to="/financial-dashboard" replace />} />
            <Route path="/schedule" element={<Gantt />} />
            <Route path="/gantt" element={<Gantt />} />
            <Route path="/calendar" element={<ProjectCalendar />} />
            <Route path="/resources" element={<Navigate to="/dashboard?tab=recursos" replace />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/operations/contract-generator" element={<ContractGenerator />} />
            <Route path="/team" element={<Team />} />
            <Route path="/team/new" element={<TeamNew />} />
            <Route path="/team/:id/edit" element={<TeamEdit />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/equipments" element={<Equipments />} />
            <Route path="/equipment" element={<Equipments />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/timesheet" element={<Timesheet />} />
            <Route path="/history" element={<History />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/pending-report" element={<PendingReport />} />
            <Route path="/gestao-central" element={<GestaoCentral />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/admin/access-control" element={<AccessControl />} />
            <Route path="/admin/reunioes" element={<Meetings />} />
            <Route path="/admin/reunioes/templates" element={<MeetingTemplates />} />
            <Route path="/admin/reunioes/templates/:id" element={<MeetingTemplateDetails />} />
            <Route path="/admin/reunioes/:id" element={<MeetingDetails />} />
            <Route path="/admin/reunioes/:id/in-progress" element={<MeetingInProgress />} />
            <Route path="/audit-logs" element={<Audit />} />
            <Route path="/admin/audit-log" element={<Audit />} />
            <Route path="/admin/audit-logs" element={<Audit />} />
            <Route path="/apa" element={<ApaPage />} />
            <Route path="/apa/dashboard" element={<Navigate to="/apa?tab=dashboard" replace />} />
            <Route path="/apa/new" element={<Navigate to="/apa?tab=new" replace />} />
            <Route path="/apa/history" element={<Navigate to="/apa?tab=history" replace />} />
            <Route path="/apa/actions" element={<Navigate to="/apa?tab=actions" replace />} />
            <Route path="/gestao/admin/documentos" element={<AdminDocuments />} />
            <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
            <Route path="/admin/efficiency" element={<EfficiencyReports />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/checklist-templates" element={<ChecklistTemplates />} />
            <Route path="/checklists" element={<ChecklistsPage />} />
            <Route path="/checklists/new" element={<Navigate to="/checklists?tab=new" replace />} />
            <Route
              path="/checklists/history"
              element={<Navigate to="/checklists?tab=history" replace />}
            />
            <Route path="/settings/templates" element={<DisciplineTemplates />} />
            <Route
              path="/settings/templates/:templateId"
              element={<DisciplineDetails isTemplateMode />}
            />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Route>,
  ),
)

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme" attribute="class">
    <AuthProvider>
      <ThemeColorInjector />
      <ThemeSync />
      <ProjectProvider>
        <RouterProvider router={router} />
      </ProjectProvider>
    </AuthProvider>
  </ThemeProvider>
)

export default App
