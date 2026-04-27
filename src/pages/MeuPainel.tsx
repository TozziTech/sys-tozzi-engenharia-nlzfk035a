import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Briefcase,
  Clock,
  CheckSquare,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { PlanilhaFinanceira } from '@/components/meu-painel/PlanilhaFinanceira'
import { NotificationsTab } from '@/components/meu-painel/NotificationsTab'
import { usePermissions } from '@/hooks/use-permissions'
import { NoteCard } from '@/components/NoteCard'
import { MyTasksList } from '@/components/meu-painel/MyTasksList'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Concluído':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-200 dark:border-emerald-900/50'
    case 'Em Andamento':
      return 'bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-900/50'
    case 'Atrasado':
      return 'bg-rose-500/10 text-rose-500 border-rose-200 dark:border-rose-900/50'
    default:
      return 'bg-slate-500/10 text-slate-500 border-slate-200 dark:border-slate-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Concluído':
      return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
    case 'Em Andamento':
      return <PlayCircle className="w-3.5 h-3.5 mr-1" />
    case 'Atrasado':
      return <AlertCircle className="w-3.5 h-3.5 mr-1" />
    default:
      return <PauseCircle className="w-3.5 h-3.5 mr-1" />
  }
}

type DashboardProject = {
  id: string
  name: string
  discipline: string
  status: string
  start_date?: string
  end_date: string
  progress: number
  client: string
}

export default function MeuPainel() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { canAccess } = usePermissions()

  const [projects, setProjects] = useState<DashboardProject[]>([])
  const [timeLogs, setTimeLogs] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const [isHoursDialogOpen, setIsHoursDialogOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [hoursLog, setHoursLog] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    hours: '',
    description: '',
  })

  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true)
  const [deadlineLeadDays, setDeadlineLeadDays] = useState('3')
  const [isSavingPrefs, setIsSavingPrefs] = useState(false)

  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    if (user) {
      setEmailNotificationsEnabled(user.email_notifications_enabled ?? true)
      setDeadlineLeadDays(user.deadline_lead_days?.toString() || '3')
    }
  }, [user])

  const handleSavePreferences = async () => {
    if (!user) return
    const days = parseInt(deadlineLeadDays, 10)
    if (isNaN(days) || days < 1) {
      toast({ title: 'O número de dias deve ser no mínimo 1.', variant: 'destructive' })
      return
    }

    setIsSavingPrefs(true)
    try {
      await pb.collection('users').update(user.id, {
        email_notifications_enabled: emailNotificationsEnabled,
        deadline_lead_days: days,
      })
      toast({ title: 'Preferências salvas com sucesso!' })
    } catch (e) {
      toast({ title: 'Erro ao salvar preferências.', variant: 'destructive' })
    } finally {
      setIsSavingPrefs(false)
    }
  }

  const loadData = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const notifRes = await pb.collection('notifications').getList(1, 1, {
        filter: `user = "${user.id}" && read = false`,
      })
      setUnreadCount(notifRes.totalItems)

      const firstDay = format(startOfMonth(new Date()), 'yyyy-MM-dd')
      const lastDay = format(endOfMonth(new Date()), 'yyyy-MM-dd')

      const [upaRes, logs, th] = await Promise.all([
        pb.collection('user_project_access').getFullList({
          filter: `user = "${user.id}"`,
        }),
        pb.collection('time_logs').getFullList({
          filter: `user_id = "${user.id}" && date >= "${firstDay}" && date <= "${lastDay}"`,
        }),
        pb.collection('tarefas_hierarquicas').getFullList({
          filter: `concluida = false`,
        }),
      ])

      const accessProjectIds = upaRes.map((u) => u.project)
      const assignedProjectIds = user.assigned_projects || []
      const allProjectIds = Array.from(new Set([...assignedProjectIds, ...accessProjectIds]))

      let projectFilter = `engineer ~ "${user.name}" || engineer = "${user.id}"`
      if (allProjectIds.length > 0) {
        const idsFilter = allProjectIds.map((id) => `id="${id}"`).join(' || ')
        projectFilter = `(${projectFilter}) || (${idsFilter})`
      }

      const engineerProjects = await pb.collection('projects').getFullList({
        filter: projectFilter,
        sort: '-created',
      })

      const uniqueProjects = engineerProjects.map((p: any) => ({
        id: p.id,
        name: p.name,
        discipline: p.discipline || 'Geral',
        status: p.status,
        start_date: p.start_date,
        end_date: p.end_date,
        progress: p.progress || 0,
        client: p.client || '-',
      }))

      setProjects(uniqueProjects)

      const projectIds = uniqueProjects.map((p) => p.id)
      setTasks(
        th.filter((t: any) => projectIds.includes(t.projeto_id) || projectIds.includes(t.project)),
      )
      setTimeLogs(logs)
    } catch (e) {
      console.error(e)
      setProjects([])
      setTasks([])
      setTimeLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime('projects', loadData)
  useRealtime('time_logs', loadData)
  useRealtime('tarefas_hierarquicas', loadData)
  useRealtime('user_project_access', loadData)
  useRealtime(
    'notifications',
    () => {
      pb.collection('notifications')
        .getList(1, 1, {
          filter: `user = "${user?.id}" && read = false`,
        })
        .then((res) => setUnreadCount(res.totalItems))
        .catch(() => {})
    },
    !!user,
  )

  const activeProjectsCount = projects.filter((p) => p.status !== 'Concluído').length
  const pendingTasksCount = tasks.length
  const hoursThisMonth = timeLogs.reduce((acc, log) => acc + (Number(log.hours) || 0), 0)

  const handleLogHours = async () => {
    if (!selectedProjectId || !hoursLog.date || !hoursLog.hours) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' })
      return
    }

    try {
      await pb.collection('time_logs').create({
        user_id: user?.id,
        project_id: selectedProjectId,
        date: hoursLog.date,
        hours: Number(hoursLog.hours),
        description: hoursLog.description,
      })
      toast({ title: 'Horas registradas com sucesso!' })
      setIsHoursDialogOpen(false)
      setHoursLog({ date: format(new Date(), 'yyyy-MM-dd'), hours: '', description: '' })
    } catch (e) {
      toast({ title: 'Erro ao registrar horas', variant: 'destructive' })
    }
  }

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [calendarMonth])

  const projectsByDate = useMemo(() => {
    const map: Record<string, DashboardProject[]> = {}
    projects.forEach((p) => {
      if (!p.start_date || !p.end_date) return
      const start = new Date(p.start_date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(p.end_date)
      end.setHours(23, 59, 59, 999)

      const interval = eachDayOfInterval({ start, end })
      interval.forEach((d) => {
        const key = format(d, 'yyyy-MM-dd')
        if (!map[key]) map[key] = []
        map[key].push(p)
      })
    })
    return map
  }, [projects])

  const selectedDateProjects = useMemo(() => {
    if (!selectedDate) return []
    return projectsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
  }, [selectedDate, projectsByDate])

  if (!user) return null

  return (
    <div className="flex-1 space-y-6 p-6 pb-20 animate-in fade-in duration-500 w-full mx-auto">
      <Tabs defaultValue="dashboard" className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              Meu Painel
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Bem-vindo(a), {user.name || 'Projetista'}. Aqui está o resumo das suas atribuições
              ativas.
            </p>
          </div>
          <TabsList className="w-full sm:w-auto flex flex-col sm:flex-row h-auto gap-2 p-1 sm:gap-0 sm:p-1 bg-transparent sm:bg-muted overflow-x-auto">
            <TabsTrigger value="dashboard" className="w-full sm:w-auto">
              Dashboards de Gestão
            </TabsTrigger>
            <TabsTrigger value="cronograma" className="w-full sm:w-auto">
              Cronograma
            </TabsTrigger>
            {canAccess('planilha_financeira') && (
              <TabsTrigger value="financeiro" className="w-full sm:w-auto">
                Planilha Financeira
              </TabsTrigger>
            )}
            <TabsTrigger value="notificacoes" className="w-full sm:w-auto flex items-center gap-2">
              Notificações
              {unreadCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="alertas" className="w-full sm:w-auto">
              Configurações de Alerta
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-primary/5 border-primary/20 dark:bg-primary/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">Projetos Ativos</CardTitle>
                <Briefcase className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-primary">{activeProjectsCount}</div>
                )}
                <p className="text-xs text-primary/70 mt-1">Projetos onde você está alocado</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{pendingTasksCount}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Em todos os seus projetos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Horas no Mês</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{hoursThisMonth.toFixed(1)}h</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Mês atual ({format(new Date(), 'MMMM', { locale: ptBR })})
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Meus Projetos
            </h3>

            {isLoading ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="flex flex-col h-[280px]">
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                <FolderKanban className="h-12 w-12 text-slate-300 mb-4 dark:text-slate-700" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  Nenhum projeto ativo
                </h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">
                  Você ainda não foi alocado(a) em nenhum projeto no momento.
                </p>
              </Card>
            ) : (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {projects.map((proj) => (
                  <Card
                    key={proj.id}
                    className="flex flex-col overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-4 border-b">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1.5 pr-2">
                          <CardTitle className="text-lg leading-tight line-clamp-2">
                            {proj.name}
                          </CardTitle>
                          <CardDescription className="font-medium text-primary">
                            Disciplina: {proj.discipline}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(proj.status || '')} variant="outline">
                          {getStatusIcon(proj.status || '')}
                          {proj.status || 'Pendente'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="py-5 flex-1 space-y-5">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <CalendarIcon className="h-4 w-4" /> Prazo
                          </span>
                          <span className="font-medium">
                            {proj.end_date
                              ? format(new Date(proj.end_date), 'dd/MM/yyyy')
                              : 'Não definido'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <Briefcase className="h-4 w-4" /> Cliente
                          </span>
                          <span className="font-medium truncate max-w-[150px]" title={proj.client}>
                            {proj.client}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-slate-600 dark:text-slate-300">Progresso</span>
                          <span>{proj.progress || 0}%</span>
                        </div>
                        <Progress value={proj.progress || 0} className="h-2" />
                      </div>
                    </CardContent>
                    <CardFooter className="pt-4 border-t bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap gap-2">
                      <Button asChild variant="outline" className="flex-1 text-xs sm:text-sm">
                        <Link to={`/projects/${proj.id}`}>Acessar Projeto</Link>
                      </Button>
                      <Button
                        variant="default"
                        className="flex-1 text-xs sm:text-sm"
                        onClick={() => {
                          setSelectedProjectId(proj.id)
                          setIsHoursDialogOpen(true)
                        }}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Registrar Horas
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <MyTasksList />

          <div className="flex justify-center w-full relative mt-8">
            <NoteCard />
          </div>

          <Dialog open={isHoursDialogOpen} onOpenChange={setIsHoursDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Registrar Horas</DialogTitle>
                <DialogDescription>
                  Aponte suas horas de trabalho para o projeto selecionado.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Projeto</Label>
                  <Input
                    value={projects.find((p) => p.id === selectedProjectId)?.name || ''}
                    disabled
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={hoursLog.date}
                      onChange={(e) => setHoursLog({ ...hoursLog, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours">Horas (h)</Label>
                    <Input
                      id="hours"
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={hoursLog.hours}
                      onChange={(e) => setHoursLog({ ...hoursLog, hours: e.target.value })}
                      placeholder="Ex: 4.5"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição do Trabalho</Label>
                  <Textarea
                    id="description"
                    value={hoursLog.description}
                    onChange={(e) => setHoursLog({ ...hoursLog, description: e.target.value })}
                    placeholder="Descreva brevemente o que foi realizado..."
                    className="resize-none h-24"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsHoursDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleLogHours}>Salvar Registro</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="cronograma" className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-4 rounded-xl border">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Cronograma de Projetos
            </h3>
            <div className="flex items-center gap-2 hidden md:flex">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-32 text-center capitalize">
                {format(calendarMonth, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="hidden md:block rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950/50">
            <div className="grid grid-cols-7 bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <div
                  key={d}
                  className="p-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 auto-rows-fr">
              {calendarDays.map((day, i) => {
                const key = format(day, 'yyyy-MM-dd')
                const dayProjects = projectsByDate[key] || []
                return (
                  <div
                    key={i}
                    className={cn(
                      'min-h-[120px] p-2 bg-white dark:bg-slate-950 transition-colors flex flex-col gap-1',
                      !isSameMonth(day, calendarMonth) &&
                        'bg-slate-50/50 dark:bg-slate-900/50 opacity-60',
                    )}
                  >
                    <div className="flex justify-end mb-1">
                      <span
                        className={cn(
                          'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                          isToday(day)
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-slate-500 dark:text-slate-400',
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[150px] pr-1 scrollbar-thin">
                      {dayProjects.map((p) => (
                        <Popover key={p.id}>
                          <PopoverTrigger asChild>
                            <div
                              className={cn(
                                'text-[10px] leading-tight p-1.5 rounded-md border transition-all hover:brightness-110 cursor-pointer truncate',
                                p.status === 'Concluído'
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                  : 'bg-primary/10 text-primary border-primary/20',
                              )}
                            >
                              {p.name}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 bg-white dark:bg-slate-950">
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-semibold text-sm">{p.name}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Cliente: {p.client || 'N/A'}
                                </p>
                              </div>
                              <div className="flex items-center justify-between text-xs font-medium">
                                <span className="text-muted-foreground">Progresso</span>
                                <span className="text-primary">{p.progress || 0}%</span>
                              </div>
                              <Progress value={p.progress || 0} className="h-1.5" />
                              <div className="pt-2 flex justify-end">
                                <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                                  <Link to={`/projects/${p.id}`}>Ver Detalhes</Link>
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col md:hidden items-center gap-6">
            <Card className="p-2 w-full flex justify-center shadow-md">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md"
                modifiers={{
                  active: (d) => !!projectsByDate[format(d, 'yyyy-MM-dd')],
                }}
                modifiersClassNames={{
                  active: 'font-bold text-primary bg-primary/10',
                }}
              />
            </Card>
            <div className="w-full space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">
                Projetos em {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''}
              </h4>
              {selectedDateProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-dashed">
                  Nenhum projeto ativo nesta data.
                </p>
              ) : (
                selectedDateProjects.map((p) => (
                  <Card key={p.id}>
                    <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
                      <div className="font-medium text-sm truncate flex-1 pr-2">{p.name}</div>
                      <Badge
                        variant="outline"
                        className={cn('whitespace-nowrap font-medium', getStatusColor(p.status))}
                      >
                        {getStatusIcon(p.status)}
                        {p.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-xs text-muted-foreground mb-2">
                        Cliente: {p.client || 'N/A'}
                      </p>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Progresso</span>
                        <span>{p.progress || 0}%</span>
                      </div>
                      <Progress value={p.progress || 0} className="h-1 mb-3" />
                      <Button size="sm" variant="outline" asChild className="w-full h-8 text-xs">
                        <Link to={`/projects/${p.id}`}>Ver Detalhes</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {canAccess('lancamentos_financeiros') && (
          <TabsContent value="financeiro" className="space-y-6">
            <PlanilhaFinanceira />
          </TabsContent>
        )}

        <TabsContent value="notificacoes" className="space-y-6">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="alertas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Alerta</CardTitle>
              <CardDescription>
                Gerencie como e quando você recebe notificações sobre os prazos dos seus projetos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                <Label htmlFor="email-alerts" className="flex flex-col space-y-1 cursor-pointer">
                  <span className="font-medium text-base">Receber notificações por e-mail</span>
                  <span className="font-normal text-sm text-slate-500">
                    Enviaremos alertas críticos (preventivo, urgência e atraso) para o seu e-mail.
                  </span>
                </Label>
                <Switch
                  id="email-alerts"
                  checked={emailNotificationsEnabled}
                  onCheckedChange={setEmailNotificationsEnabled}
                />
              </div>
              <div className="space-y-3 border p-4 rounded-lg">
                <Label htmlFor="lead-days" className="font-medium text-base">
                  Antecedência do alerta preventivo (dias)
                </Label>
                <p className="text-sm text-slate-500 mb-2">
                  Quantos dias antes do vencimento do prazo você deseja ser alertado?
                </p>
                <div className="flex items-center max-w-[200px]">
                  <Input
                    id="lead-days"
                    type="number"
                    min="1"
                    value={deadlineLeadDays}
                    onChange={(e) => setDeadlineLeadDays(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSavePreferences} disabled={isSavingPrefs}>
                {isSavingPrefs ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
