import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { Header } from './Header'
import { NewProjectModal } from './NewProjectModal'
import { useAuth } from '@/hooks/use-auth'
import { usePreferencesStore } from '@/stores/usePreferencesStore'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { AppBreadcrumbs } from './AppBreadcrumbs'

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
          <main className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col">
            <div className="px-4 md:px-8 pt-4 md:pt-6 pb-0 max-w-[100vw] overflow-x-hidden">
              <AppBreadcrumbs />
            </div>
            <Outlet />
          </main>
          <NewProjectModal />
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
