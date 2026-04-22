import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import Performance from './pages/Performance'
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
import Gantt from './pages/Gantt'
import ProjectCalendar from './pages/ProjectCalendar'
import Bottlenecks from './pages/Bottlenecks'
import Timesheet from './pages/Timesheet'
import History from './pages/History'
import Team from './pages/Team'
import TeamNew from './pages/TeamNew'
import TeamEdit from './pages/TeamEdit'
import Activities from './pages/Activities'
import PendingReport from './pages/PendingReport'
import Finance from './pages/Finance'
import Quotes from './pages/Quotes'
import ContractGenerator from './pages/ContractGenerator'
import GestaoCentral from './pages/GestaoCentral'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import Equipments from './pages/Equipments'
import Audit from './pages/Audit'
import AdminDocuments from './pages/admin/AdminDocuments'
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import DocumentResourcesPage from './pages/files/DocumentResourcesPage'
import FavoriteDocumentsPage from './pages/files/FavoriteDocumentsPage'
import { AuthProvider, useAuth } from './hooks/use-auth'
import { RoleGuard } from './components/auth/RoleGuard'
import { AdminGuard } from './components/auth/AdminGuard'
import { ManagerGuard } from './components/auth/ManagerGuard'
import { ThemeColorInjector } from './components/ThemeColorInjector'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

function HomeRoute() {
  const { user } = useAuth()
  if (user?.role === 'Cliente') return <Navigate to="/gestao/painel-cliente" replace />
  if (user?.role === 'Administrador' || user?.role === 'Gerente de Projeto')
    return <Navigate to="/dashboard" replace />
  return <Navigate to="/meu-painel" replace />
}

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme" attribute="class">
    <ThemeColorInjector />
    <AuthProvider>
      <ProjectProvider>
        <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
          <TooltipProvider>
            <RealtimeSync />
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route element={<RoleGuard />}>
                <Route element={<Layout />}>
                  {/* Public authenticated routes */}
                  <Route path="/" element={<HomeRoute />} />
                  <Route path="/meu-painel" element={<MeuPainel />} />
                  <Route path="/designer-panel" element={<DesignerPanel />} />
                  <Route path="/meus-projetos" element={<Projects filterOnlyMine />} />
                  <Route path="/projects/:id" element={<ProjectDetails />} />
                  <Route
                    path="/projects/:id/disciplines/:moduleId"
                    element={<DisciplineDetails />}
                  />
                  <Route path="/gestao/painel-cliente" element={<ClientDashboard />} />
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
                    element={
                      <DocumentResourcesPage category="Projetos Base" title="Projetos Base" />
                    }
                  />
                  <Route
                    path="/files/templates"
                    element={
                      <DocumentResourcesPage
                        category="Documentos Modelos"
                        title="Documentos Modelos"
                      />
                    }
                  />
                  <Route
                    path="/files/courses"
                    element={<DocumentResourcesPage category="Cursos" title="Cursos" />}
                  />
                  <Route path="/files/favorites" element={<FavoriteDocumentsPage />} />

                  {/* Restricted to Admins and Project Managers */}
                  <Route element={<ManagerGuard />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/executive-dashboard" element={<ExecutiveDashboard />} />
                    <Route path="/financial-dashboard" element={<FinancialDashboard />} />
                    <Route path="/diagnostics" element={<Bottlenecks />} />
                    <Route path="/bottlenecks" element={<Bottlenecks />} />
                    <Route path="/performance" element={<Performance />} />
                    <Route path="/deadline-audit" element={<DeadlineAudit />} />
                    <Route path="/management/bank-accounts" element={<BankAccounts />} />
                    <Route path="/financial" element={<Financial />} />
                    <Route path="/financeiro" element={<Finance />} />
                    <Route path="/schedule" element={<Gantt />} />
                    <Route path="/gantt" element={<Gantt />} />
                    <Route path="/calendar" element={<ProjectCalendar />} />
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
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/timesheet" element={<Timesheet />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/activities" element={<Activities />} />
                    <Route path="/pending-report" element={<PendingReport />} />
                    <Route path="/gestao-central" element={<GestaoCentral />} />
                    <Route path="/audit" element={<Audit />} />
                  </Route>

                  {/* Admin Only Routes */}
                  <Route element={<AdminGuard />}>
                    <Route path="/audit-logs" element={<Audit />} />
                    <Route path="/admin/audit-log" element={<Audit />} />
                    <Route path="/admin/audit-logs" element={<Audit />} />
                    <Route path="/gestao/admin/documentos" element={<AdminDocuments />} />
                    <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </BrowserRouter>
      </ProjectProvider>
    </AuthProvider>
  </ThemeProvider>
)

export default App
