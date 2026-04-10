import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { Header } from './Header'
import { NewProjectModal } from './NewProjectModal'

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-50 dark:bg-slate-950 flex flex-col min-h-screen w-full">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <NewProjectModal />
      </SidebarInset>
    </SidebarProvider>
  )
}
