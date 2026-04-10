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
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white dark:border-slate-900">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[calc(100vw-2rem)] sm:w-80 p-0 mr-4 mt-2 shadow-lg rounded-xl overflow-hidden"
              align="end"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50/80 backdrop-blur-sm dark:bg-slate-900/80">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Notificações</span>
                  {unreadCount > 0 && (
                    <span className="flex h-5 items-center justify-center rounded-full bg-indigo-100 px-2 text-[10px] font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                      {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto text-xs px-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                    onClick={markAllNotificationsAsRead}
                  >
                    Marcar todas lidas
                  </Button>
                )}
              </div>
              <ScrollArea className="max-h-[360px]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
                    <div className="p-3 bg-slate-100 rounded-full dark:bg-slate-800">
                      <Check className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                    </div>
                    <span>Tudo em dia! Nenhuma notificação.</span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {[...notifications]
                      .sort(
                        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
                      )
                      .map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 border-b last:border-0 flex flex-col gap-1.5 transition-colors group ${!notif.read ? 'bg-indigo-50/40 dark:bg-indigo-900/20 hover:bg-indigo-50/80 dark:hover:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <Link
                              to={notif.link || '#'}
                              onClick={() => markNotificationAsRead(notif.id)}
                              className={`text-sm font-medium hover:underline hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors leading-tight ${!notif.read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}
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
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(notif.timestamp).toLocaleString(undefined, {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {notif.read && (
                              <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                Lida
                              </span>
                            )}
                          </div>
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
