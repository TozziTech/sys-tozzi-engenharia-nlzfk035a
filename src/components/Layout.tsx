import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { Header } from './Header'
import { NewProjectModal } from './NewProjectModal'
import { useAuth } from '@/hooks/use-auth'
import { usePreferencesStore } from '@/stores/usePreferencesStore'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

export default function Layout() {
  const { user } = useAuth()
  const { loadPreferences, density } = usePreferencesStore()

  useEffect(() => {
    if (user) {
      loadPreferences(user)
    }
  }, [user, loadPreferences])

  return (
    <SidebarProvider>
      <div
        className={cn('flex min-h-screen w-full', density === 'compact' ? 'density-compact' : '')}
      >
        <AppSidebar />
        <SidebarInset className="bg-transparent flex flex-col min-h-screen w-full">
          <Header />
          <main className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Outlet />
          </main>
          <NewProjectModal />
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
