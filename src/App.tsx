import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ProjectProvider } from '@/stores/useProjectStore'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetails from './pages/ProjectDetails'
import { RealtimeSync } from './components/RealtimeSync'
import Clients from './pages/Clients'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Gantt from './pages/Gantt'
import Bottlenecks from './pages/Bottlenecks'
import Timesheet from './pages/Timesheet'
import History from './pages/History'
import Team from './pages/Team'
import Activities from './pages/Activities'
import PendingReport from './pages/PendingReport'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'

const App = () => (
  <ProjectProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <RealtimeSync />
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/gantt" element={<Gantt />} />
            <Route path="/bottlenecks" element={<Bottlenecks />} />
            <Route path="/timesheet" element={<Timesheet />} />
            <Route path="/history" element={<History />} />
            <Route path="/team" element={<Team />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/pending-report" element={<PendingReport />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </ProjectProvider>
)

export default App
