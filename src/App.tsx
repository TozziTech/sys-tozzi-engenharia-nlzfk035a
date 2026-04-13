import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ProjectProvider } from '@/stores/useProjectStore'
import Dashboard from './pages/Dashboard'
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

function hexToHsl(hex: string) {
  let r = 0,
    g = 0,
    b = 0
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16)
    g = parseInt(hex[2] + hex[2], 16)
    b = parseInt(hex[3] + hex[3], 16)
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16)
    g = parseInt(hex.substring(3, 5), 16)
    b = parseInt(hex.substring(5, 7), 16)
  }
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`
}

const CompanyColorInjector = () => {
  useEffect(() => {
    pb.collection('company_settings')
      .getFirstListItem('')
      .then((res) => {
        if (res.primary_color) {
          document.documentElement.style.setProperty('--primary', hexToHsl(res.primary_color))
        }
      })
      .catch(() => {})
  }, [])

  useRealtime('company_settings', (e) => {
    if (e.record.primary_color) {
      document.documentElement.style.setProperty('--primary', hexToHsl(e.record.primary_color))
    }
  })

  return null
}
import ProjectDetails from './pages/ProjectDetails'
import DisciplineDetails from './pages/DisciplineDetails'
import { RealtimeSync } from './components/RealtimeSync'
import Financial from './pages/Financial'
import FinancialDashboard from './pages/FinancialDashboard'
import Clients from './pages/Clients'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Gantt from './pages/Gantt'
import ProjectCalendar from './pages/ProjectCalendar'
import Bottlenecks from './pages/Bottlenecks'
import Timesheet from './pages/Timesheet'
import History from './pages/History'
import Team from './pages/Team'
import Activities from './pages/Activities'
import PendingReport from './pages/PendingReport'
import Finance from './pages/Finance'
import Quotes from './pages/Quotes'
import GestaoCentral from './pages/GestaoCentral'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import Equipments from './pages/Equipments'
import Audit from './pages/Audit'
import AccessControl from './pages/AccessControl'
import { AuthProvider } from './hooks/use-auth'
import { RoleGuard } from './components/auth/RoleGuard'
import { AdminGuard } from './components/auth/AdminGuard'
import { ThemeColorInjector } from './components/ThemeColorInjector'

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <ThemeColorInjector />
    <CompanyColorInjector />
    <AuthProvider>
      <ProjectProvider>
        <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
          <TooltipProvider>
            <RealtimeSync />
            <Toaster />
            <Sonner />
            <Routes>
              <Route element={<RoleGuard />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/executive-dashboard" element={<ExecutiveDashboard />} />
                  <Route path="/meu-painel" element={<MeuPainel />} />
                  <Route path="/designer-panel" element={<DesignerPanel />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:id" element={<ProjectDetails />} />
                  <Route
                    path="/projects/:id/disciplines/:moduleId"
                    element={<DisciplineDetails />}
                  />
                  <Route path="/financial" element={<Financial />} />
                  <Route path="/financeiro" element={<Finance />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/gantt" element={<Gantt />} />
                  <Route path="/schedule" element={<Gantt />} />
                  <Route path="/calendar" element={<ProjectCalendar />} />
                  <Route path="/bottlenecks" element={<Bottlenecks />} />
                  <Route path="/diagnostics" element={<Bottlenecks />} />
                  <Route path="/financial-dashboard" element={<FinancialDashboard />} />
                  <Route path="/timesheet" element={<Timesheet />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/team" element={<Team />} />
                  <Route path="/activities" element={<Activities />} />
                  <Route path="/pending-report" element={<PendingReport />} />
                  <Route path="/performance" element={<Performance />} />
                  <Route path="/deadline-audit" element={<DeadlineAudit />} />
                  <Route path="/quotes" element={<Quotes />} />
                  <Route path="/gestao-central" element={<GestaoCentral />} />
                  <Route path="/equipments" element={<Equipments />} />
                  <Route path="/equipment" element={<Equipments />} />
                  <Route path="/audit" element={<Audit />} />
                  <Route path="/audit-logs" element={<Audit />} />
                  <Route element={<AdminGuard />}>
                    <Route path="/admin/audit-log" element={<Audit />} />
                  </Route>
                  <Route path="/access-control" element={<AccessControl />} />
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
