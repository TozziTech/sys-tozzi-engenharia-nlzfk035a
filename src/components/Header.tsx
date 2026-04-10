import { Search, Bell, Plus, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import useProjectStore from '@/stores/useProjectStore'

export function Header() {
  const {
    globalSearch,
    setGlobalSearch,
    setNewProjectModalOpen,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useProjectStore()

  const unreadCount = notifications.filter((n) => !n.read).length

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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-slate-500 hover:text-slate-900"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white"></span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4 mt-2" align="end">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50/50 dark:bg-slate-900/50">
                <span className="font-semibold text-sm">Notificações</span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto text-xs px-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                    onClick={markAllNotificationsAsRead}
                  >
                    Marcar todas lidas
                  </Button>
                )}
              </div>
              <ScrollArea className="max-h-[300px]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <Bell className="h-8 w-8 text-slate-200 dark:text-slate-800" />
                    <span>Nenhuma notificação</span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b last:border-0 flex flex-col gap-1.5 transition-colors ${!notif.read ? 'bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <Link
                            to={notif.link || '#'}
                            onClick={() => markNotificationAsRead(notif.id)}
                            className="text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors leading-tight"
                          >
                            {notif.title}
                          </Link>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {notif.description}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium mt-1">
                          {new Date(notif.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
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
