import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ProjectProvider } from '@/stores/useProjectStore'
import Index from './pages/Index'
import ProjectDetails from './pages/ProjectDetails'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'

const App = () => (
  <ProjectProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            {/* Nav links just point to dashboard for this demo context */}
            <Route path="/projects" element={<Index />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/clients" element={<Index />} />
            <Route path="/reports" element={<Index />} />
            <Route path="/settings" element={<Index />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </ProjectProvider>
)

export default App
