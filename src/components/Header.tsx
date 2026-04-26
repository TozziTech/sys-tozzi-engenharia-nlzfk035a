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
  X,
  AlertCircle,
  Calendar,
  Clock,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
import { DensityToggle } from './DensityToggle'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'

export function Header() {
  const navigate = useNavigate()
  const { projects, globalSearch, setGlobalSearch, setNewProjectModalOpen } = useProjectStore()

  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])

  const loadNotifications = async () => {
    if (!user) return
    try {
      const data = await pb.collection('notifications').getFullList({
        filter: `user = "${user.id}"`,
        sort: '-created',
      })
      setNotifications(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [user])

  const { toast } = useToast()

  useRealtime(
    'notifications',
    (e) => {
      loadNotifications()
      if (e.action === 'create' && e.record.user === user?.id) {
        toast({
          title: e.record.title,
          description: e.record.message,
        })
      }
    },
    !!user,
  )

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

  const unreadCount = notifications.filter((n) => !n.read).length

  const markNotificationAsRead = async (id: string) => {
    try {
      await pb.collection('notifications').update(id, { read: true })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch (e) {
      console.error(e)
    }
  }

  const markAllNotificationsAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read)
      await Promise.all(
        unread.map((n) => pb.collection('notifications').update(n.id, { read: true })),
      )
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (e) {
      console.error(e)
    }
  }

  const handleApproveFromNotification = async (notif: any, approved: boolean) => {
    try {
      if (notif.action_type === 'approve_phase' && notif.action_payload) {
        if (approved) {
          await pb.collection('fases_projeto').update(notif.action_payload, { status: 'Aprovado' })
          toast({ title: 'Fase Aprovada' })
        } else {
          const feedback = prompt('Por favor, informe o motivo da revisão:')
          if (!feedback) return
          await pb.collection('fases_projeto').update(notif.action_payload, {
            status: 'Revisão Solicitada',
            feedback_revisao: feedback,
          })
          toast({ title: 'Revisão Solicitada' })
        }
        await markNotificationAsRead(notif.id)
        await pb.collection('notifications').update(notif.id, { action_type: '' })
        loadNotifications()
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
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

  const getNotificationVisuals = (notif: any) => {
    const type = notif.action_type || ''
    const title = notif.title?.toLowerCase() || ''

    if (
      type === 'Alerta de atraso' ||
      title.includes('atraso') ||
      title.includes('atrasada') ||
      title.includes('vencida')
    ) {
      return {
        Icon: AlertCircle,
        colorText: 'text-rose-600 dark:text-rose-500',
        bgUnread: 'bg-rose-50 hover:bg-rose-100/80 dark:bg-rose-950/20 dark:hover:bg-rose-950/30',
        borderClass: 'border-l-4 border-l-rose-500',
        indicator: 'bg-rose-500',
      }
    }
    if (type === 'Alerta de urgência' || title.includes('hoje') || title.includes('urgência')) {
      return {
        Icon: Calendar,
        colorText: 'text-orange-600 dark:text-orange-500',
        bgUnread:
          'bg-orange-50 hover:bg-orange-100/80 dark:bg-orange-950/20 dark:hover:bg-orange-950/30',
        borderClass: 'border-l-4 border-l-orange-500',
        indicator: 'bg-orange-500',
      }
    }
    if (
      type === 'Alerta preventivo' ||
      title.includes('preventivo') ||
      title.includes('3 dias') ||
      title.includes('vence em')
    ) {
      return {
        Icon: Clock,
        colorText: 'text-yellow-600 dark:text-yellow-500',
        bgUnread:
          'bg-yellow-50 hover:bg-yellow-100/80 dark:bg-yellow-950/20 dark:hover:bg-yellow-950/30',
        borderClass: 'border-l-4 border-l-yellow-500',
        indicator: 'bg-yellow-500',
      }
    }

    if (notif.is_important || title.includes('urgente')) {
      return {
        Icon: AlertTriangle,
        colorText: 'text-red-600 dark:text-red-500',
        bgUnread: 'bg-red-50 hover:bg-red-100/80 dark:bg-red-950/20 dark:hover:bg-red-950/30',
        borderClass: 'border-l-4 border-l-red-600',
        indicator: 'bg-red-600 animate-pulse',
      }
    }

    if (title.includes('novo arquivo') || title.includes('documento')) {
      return {
        Icon: FileText,
        colorText: 'text-blue-600 dark:text-blue-500',
        bgUnread: 'bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-950/20 dark:hover:bg-blue-950/30',
        borderClass: 'border-l-4 border-l-blue-500',
        indicator: 'bg-blue-500',
      }
    }

    return {
      Icon: Bell,
      colorText: 'text-primary',
      bgUnread: 'bg-primary/5 hover:bg-primary/10',
      borderClass: 'border-l-4 border-l-primary/40',
      indicator: 'bg-primary',
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl px-4 md:px-6 shadow-sm">
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
          <DensityToggle />
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
          <Sheet>
            <SheetTrigger asChild>
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
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col gap-0 border-l">
              <SheetHeader className="px-4 py-4 border-b text-left flex flex-row items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-lg">Notificações</SheetTitle>
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
                    className="h-8 text-xs px-3 text-primary hover:text-primary/80 mr-8"
                    onClick={markAllNotificationsAsRead}
                  >
                    Marcar todas lidas
                  </Button>
                )}
              </SheetHeader>
              <ScrollArea className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center justify-center h-full gap-3 mt-20">
                    <div className="p-4 bg-muted rounded-full">
                      <Bell className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <span className="font-medium text-foreground">Tudo em dia!</span>
                    <span className="text-xs">Você não tem novas notificações no momento.</span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((notif) => {
                      const visuals = getNotificationVisuals(notif)
                      return (
                        <div
                          key={notif.id}
                          className={`p-4 border-b border-r-0 border-t-0 last:border-b-0 flex flex-col gap-1.5 transition-colors group relative ${!notif.read ? visuals.bgUnread : 'hover:bg-muted/50 bg-transparent'} ${visuals.borderClass}`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex items-start gap-2">
                              <visuals.Icon
                                className={`mt-0.5 h-4 w-4 shrink-0 ${visuals.colorText} ${notif.read ? 'opacity-50' : ''}`}
                              />
                              <SheetClose asChild>
                                <Link
                                  to={notif.link || '#'}
                                  onClick={() => markNotificationAsRead(notif.id)}
                                  className={`text-sm font-medium hover:underline hover:text-primary transition-colors leading-tight ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}
                                >
                                  {notif.title}
                                </Link>
                              </SheetClose>
                            </div>
                            {!notif.read && (
                              <div
                                className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 shadow-sm ${visuals.indicator}`}
                              />
                            )}
                          </div>
                          <p
                            className={`text-sm leading-relaxed ${!notif.read ? 'text-foreground/80' : 'text-muted-foreground'}`}
                          >
                            {notif.message}
                          </p>

                          {notif.action_type === 'approve_phase' && !notif.read && (
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7 px-3"
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleApproveFromNotification(notif, true)
                                }}
                              >
                                <Check className="w-3 h-3 mr-1" /> Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-xs h-7 px-3"
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleApproveFromNotification(notif, false)
                                }}
                              >
                                <X className="w-3 h-3 mr-1" /> Solicitar Revisão
                              </Button>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[11px] text-muted-foreground font-medium">
                              {formatDistanceToNow(new Date(notif.created), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                            {notif.read && (
                              <span className="text-[11px] text-muted-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                <Check className="h-3 w-3" /> Lida
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </SheetContent>
          </Sheet>

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
