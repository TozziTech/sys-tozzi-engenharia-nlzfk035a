import {
  Search,
  Bell,
  Plus,
  Check,
  AlertTriangle,
  Activity,
  Database,
  FolderGit2,
  CheckSquare,
  FileText,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useState, useEffect } from 'react'
import useProjectStore from '@/stores/useProjectStore'
import { ThemeToggle } from './ThemeToggle'
import pb from '@/lib/pocketbase/client'

export function Header() {
  const navigate = useNavigate()
  const {
    projects,
    globalSearch,
    setGlobalSearch,
    setNewProjectModalOpen,
    notifications: initialNotifications,
    markNotificationAsRead: storeMarkRead,
    markAllNotificationsAsRead: storeMarkAllRead,
  } = useProjectStore()

  const [localNotifications, setLocalNotifications] = useState<any[]>([])

  // Global Search State
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState({
    projects: [] as any[],
    tasks: [] as any[],
    documents: [] as any[],
  })
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults({ projects: [], tasks: [], documents: [] })
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const [projectsRes, tasksRes, documentsRes] = await Promise.all([
          pb
            .collection('projects')
            .getList(1, 5, { filter: `name ~ "${searchQuery.replace(/"/g, '')}"` }),
          pb.collection('tasks').getList(1, 5, {
            filter: `title ~ "${searchQuery.replace(/"/g, '')}"`,
            expand: 'project,module',
          }),
          pb.collection('project_documents').getList(1, 5, {
            filter: `name ~ "${searchQuery.replace(/"/g, '')}"`,
            expand: 'project',
          }),
        ])
        setSearchResults({
          projects: projectsRes.items,
          tasks: tasksRes.items,
          documents: documentsRes.items,
        })
      } catch (e) {
        console.error('Search error:', e)
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const handleAddNotification = (e: any) => {
      setLocalNotifications((prev) => [e.detail, ...prev])
    }
    window.addEventListener('add-notification', handleAddNotification)
    return () => window.removeEventListener('add-notification', handleAddNotification)
  }, [])

  const allNotifications = [...localNotifications, ...initialNotifications]
  const unreadCount = allNotifications.filter((n) => !n.read).length

  const markNotificationAsRead = (id: string) => {
    setLocalNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    if (initialNotifications.some((n: any) => n.id === id)) {
      storeMarkRead(id)
    }
  }

  const markAllNotificationsAsRead = () => {
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    storeMarkAllRead()
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const criticalProjects = projects.filter((p) => {
    if (p.status === 'Concluído') return false
    const endDate = new Date(p.endDate)
    endDate.setHours(0, 0, 0, 0)
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 3
  })

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-1 items-center gap-4 md:gap-8">
        <div className="hidden sm:flex items-center">
          <Tooltip>
            <TooltipTrigger asChild></TooltipTrigger>
            <TooltipContent>
              <p>Os dados são salvos apenas localmente na sessão atual.</p>
              <p>Conecte um backend para persistência permanente.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="relative flex-1 md:grow-0">
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={searchOpen}
                className="w-full justify-start text-muted-foreground bg-muted border-transparent md:w-[300px] lg:w-[400px] rounded-full hover:bg-muted/80"
              >
                <Search className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">Buscar projetos, tarefas, documentos...</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[calc(100vw-2rem)] md:w-[300px] lg:w-[400px] p-0 rounded-xl overflow-hidden shadow-lg border-border"
              align="start"
            >
              <Command shouldFilter={false} className="bg-transparent">
                <CommandInput
                  placeholder="Digite para buscar..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="border-none focus:ring-0"
                />
                <CommandList>
                  {isSearching && searchQuery ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Buscando...</div>
                  ) : (
                    <>
                      <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

                      {searchResults.projects.length > 0 && (
                        <CommandGroup heading="Projetos">
                          {searchResults.projects.map((p) => (
                            <CommandItem
                              key={`p-${p.id}`}
                              onSelect={() => {
                                navigate(`/projects/${p.id}`)
                                setSearchOpen(false)
                              }}
                              className="flex items-center gap-2 cursor-pointer py-2"
                            >
                              <FolderGit2 className="h-4 w-4 text-primary shrink-0" />
                              <div className="flex flex-col overflow-hidden">
                                <span className="truncate">{p.name}</span>
                                {p.client && (
                                  <span className="text-xs text-muted-foreground truncate">
                                    {p.client}
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}

                      {searchResults.tasks.length > 0 && (
                        <CommandGroup heading="Tarefas">
                          {searchResults.tasks.map((t) => (
                            <CommandItem
                              key={`t-${t.id}`}
                              onSelect={() => {
                                if (t.project && t.module) {
                                  navigate(`/projects/${t.project}/disciplines/${t.module}`)
                                } else if (t.project) {
                                  navigate(`/projects/${t.project}`)
                                } else {
                                  navigate(`/activities`)
                                }
                                setSearchOpen(false)
                              }}
                              className="flex items-center gap-2 cursor-pointer py-2"
                            >
                              <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                              <div className="flex flex-col overflow-hidden">
                                <span className="truncate">{t.title}</span>
                                {t.expand?.project?.name && (
                                  <span className="text-xs text-muted-foreground truncate">
                                    {t.expand.project.name}
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}

                      {searchResults.documents.length > 0 && (
                        <CommandGroup heading="Documentos">
                          {searchResults.documents.map((d) => (
                            <CommandItem
                              key={`d-${d.id}`}
                              onSelect={() => {
                                navigate(d.project ? `/projects/${d.project}` : '#')
                                setSearchOpen(false)
                              }}
                              className="flex items-center gap-2 cursor-pointer py-2"
                            >
                              <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                              <div className="flex flex-col overflow-hidden">
                                <span className="truncate">{d.name}</span>
                                {d.expand?.project?.name && (
                                  <span className="text-xs text-muted-foreground truncate">
                                    {d.expand.project.name}
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/performance">
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex gap-2 text-muted-foreground hover:text-foreground"
            >
              <Activity className="h-4 w-4" />
              <span>Performance</span>
            </Button>
          </Link>
          <ThemeToggle />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
              >
                <AlertTriangle className="h-5 w-5" />
                {criticalProjects.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white dark:border-slate-900">
                    {criticalProjects.length > 99 ? '99+' : criticalProjects.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[calc(100vw-2rem)] sm:w-80 p-0 mr-4 mt-2 shadow-lg rounded-xl overflow-hidden"
              align="end"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b bg-destructive/10 backdrop-blur-sm border-destructive/20">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-destructive">Prazos Críticos</span>
                  {criticalProjects.length > 0 && (
                    <span className="flex h-5 items-center justify-center rounded-full bg-destructive/20 px-2 text-[10px] font-bold text-destructive">
                      {criticalProjects.length}
                    </span>
                  )}
                </div>
              </div>
              <ScrollArea className="max-h-[360px]">
                {criticalProjects.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
                    <div className="p-3 bg-muted rounded-full">
                      <Check className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <span>Nenhum projeto em prazo crítico.</span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {criticalProjects.map((proj) => (
                      <div
                        key={proj.id}
                        className="p-4 border-b last:border-0 flex flex-col gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <Link
                            to={`/projects/${proj.id}`}
                            className="text-sm font-medium hover:underline hover:text-primary transition-colors leading-tight text-foreground"
                          >
                            {proj.name}
                          </Link>
                          <Badge variant="destructive" className="text-[10px] h-5 px-1.5 shrink-0">
                            Crítico
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Eng: {proj.engineer}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-1">
                          Vence em: {new Date(proj.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground"
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
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Notificações</span>
                  {unreadCount > 0 && (
                    <span className="flex h-5 items-center justify-center rounded-full bg-primary/10 px-2 text-[10px] font-bold text-primary">
                      {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto text-xs px-2 text-primary hover:text-primary/80"
                    onClick={markAllNotificationsAsRead}
                  >
                    Marcar todas lidas
                  </Button>
                )}
              </div>
              <ScrollArea className="max-h-[360px]">
                {allNotifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
                    <div className="p-3 bg-muted rounded-full">
                      <Check className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <span>Tudo em dia! Nenhuma notificação.</span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {[...allNotifications]
                      .sort(
                        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
                      )
                      .map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 border-b last:border-0 flex flex-col gap-1.5 transition-colors group ${!notif.read ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'}`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <Link
                              to={notif.link || '#'}
                              onClick={() => markNotificationAsRead(notif.id)}
                              className={`text-sm font-medium hover:underline hover:text-primary transition-colors leading-tight ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}
                            >
                              {notif.title}
                            </Link>
                            {!notif.read && (
                              <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {notif.description}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {new Date(notif.timestamp).toLocaleString(undefined, {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {notif.read && (
                              <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
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
            size="icon"
            className="md:hidden bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-sm transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
