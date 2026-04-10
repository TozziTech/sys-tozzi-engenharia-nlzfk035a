import { Search, Bell, Plus } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import useProjectStore from '@/stores/useProjectStore'

export function Header() {
  const { globalSearch, setGlobalSearch, setNewProjectModalOpen } = useProjectStore()

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-white dark:bg-slate-900 px-4 md:px-6 shadow-sm">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-1 items-center gap-4 md:gap-8">
        <div className="relative flex-1 md:grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar projetos..."
            className="w-full rounded-full bg-slate-100 dark:bg-slate-800 pl-9 md:w-[300px] lg:w-[400px] border-transparent focus-visible:ring-indigo-500"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-500 hover:text-slate-900"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white"></span>
          </Button>
          <Button
            onClick={() => setNewProjectModalOpen(true)}
            className="hidden md:flex bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-sm transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4 mr-2" /> Novo Projeto
          </Button>
          <Button
            onClick={() => setNewProjectModalOpen(true)}
            size="icon"
            className="md:hidden bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-sm transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
