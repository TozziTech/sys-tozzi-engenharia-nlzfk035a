import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  CheckCircle2,
  HardHat,
  PlayCircle,
  PauseCircle,
  Loader2,
  FolderKanban,
  CheckSquare,
  LayoutDashboard,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Printer,
  UploadCloud,
  TrendingUp,
} from 'lucide-react'
import {
  format,
  isAfter,
  isBefore,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  differenceInDays,
  startOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { usePermissions } from '@/hooks/use-permissions'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PrintWeeklyReport } from '@/components/PrintWeeklyReport'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Concluído':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
    case 'Em Andamento':
    case 'Em Execução':
      return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20'
    case 'Atrasado':
      return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-500 dark:border-rose-500/20'
    case 'Pendente':
    case 'Planejamento':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Concluído':
      return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
    case 'Em Andamento':
    case 'Em Execução':
      return <PlayCircle className="w-3.5 h-3.5 mr-1" />
    case 'Atrasado':
      return <AlertCircle className="w-3.5 h-3.5 mr-1" />
    default:
      return <PauseCircle className="w-3.5 h-3.5 mr-1" />
  }
}

export default function DesignerPanel() {
  const { user } = useAuth()
  const { canAccess } = usePermissions()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [dateFilter, setDateFilter] = useState('Todos')
  const { toast } = useToast()

  const [modules, setModules] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [myProjects, setMyProjects] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [hoursLog, setHoursLog] = useState({
    startTime: '',
    endTime: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })
  const [isHoursDialogOpen, setIsHoursDialogOpen] = useState(false)
  const [selectedProjectForHours, setSelectedProjectForHours] = useState<any>(null)

  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const [projectStatusFilter, setProjectStatusFilter] = useState('Todos')
  const [printMode, setPrintMode] = useState<'weekly' | null>(null)

  const [uploadProject, setUploadProject] = useState<any>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handlePrintWeeklyReport = () => {
    setPrintMode('weekly')
    setTimeout(() => {
      window.print()
      setPrintMode(null)
    }, 100)
  }

  const loadData = async () => {
    if (!user) return
    try {
      setLoading(true)
      const [modulesRecords, tasksRecords, upaRes, clientsRes] = await Promise.all([
        pb.collection('project_modules').getFullList({
          filter: `responsible = "${user.id}" || designer = "${user.id}"`,
          expand: 'project',
          sort: '-created',
        }),
        pb.collection('tasks').getFullList({
          filter: `responsible = "${user.id}" && status != "Concluído"`,
          expand: 'project,module',
          sort: 'due_date',
        }),
        pb.collection('user_project_access').getFullList({
          filter: `user = "${user.id}"`,
        }),
        pb.collection('clients').getFullList(),
      ])

      setModules(modulesRecords)
      setTasks(tasksRecords)
      setClients(clientsRes)

      let assignedProjectIds = user.assigned_projects || []
      const accessProjectIds = upaRes.map((u) => u.project)
      const allProjectIds = Array.from(new Set([...assignedProjectIds, ...accessProjectIds]))

      if (allProjectIds.length > 0) {
        const projectsFilter = allProjectIds.map((id) => `id="${id}"`).join(' || ')
        const projectsRes = await pb.collection('projects').getFullList({
          filter: projectsFilter,
          sort: '-created',
        })
        setMyProjects(projectsRes)
      } else {
        setMyProjects([])
      }
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar seus dados',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])
  useRealtime('project_modules', loadData)
  useRealtime('tasks', loadData)
  useRealtime('projects', loadData)
  useRealtime('clients', loadData)

  const handleLogHours = async () => {
    if (!hoursLog.date || !hoursLog.startTime || !hoursLog.endTime || !hoursLog.description) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    const start = new Date(`2000-01-01T${hoursLog.startTime}`)
    const end = new Date(`2000-01-01T${hoursLog.endTime}`)

    if (end <= start) {
      toast({
        title: 'Erro',
        description: 'Término deve ser posterior ao início.',
        variant: 'destructive',
      })
      return
    }

    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

    try {
      if (selectedProjectForHours) {
        await pb.collection('time_logs').create({
          user_id: user.id,
          project_id: selectedProjectForHours.project,
          hours: durationHours,
          date: hoursLog.date + ' 12:00:00.000Z',
          description: hoursLog.description,
        })
      }

      toast({
        title: 'Sucesso',
        description: `${durationHours.toFixed(1)}h registradas na disciplina.`,
      })
      setIsHoursDialogOpen(false)
      setHoursLog({
        startTime: '',
        endTime: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      })
      setSelectedProjectForHours(null)
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    }
  }

  const handleQuickUpload = async () => {
    if (!uploadProject || !uploadFile) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('project', uploadProject.id)
      formData.append('name', uploadFile.name)
      formData.append('type', 'Other')
      formData.append('file', uploadFile)

      await pb.collection('project_documents').create(formData)
      toast({
        title: 'Upload concluído',
        description: 'Documento de campo anexado com sucesso ao projeto.',
      })
      setUploadProject(null)
      setUploadFile(null)
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível enviar o arquivo.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const weeklyProjects = useMemo(() => {
    const now = new Date()
    const start = startOfWeek(now, { weekStartsOn: 0 })
    const end = endOfWeek(now, { weekStartsOn: 0 })

    return myProjects.filter((p) => {
      const pStart = p.start_date ? new Date(p.start_date) : new Date(0)
      const pEnd = p.end_date ? new Date(p.end_date) : new Date(8640000000000000)
      return isBefore(pStart, end) && isAfter(pEnd, start)
    })
  }, [myProjects])

  const chartData = useMemo(() => {
    const counts = { Pendente: 0, 'Em Andamento': 0, Concluído: 0 }
    weeklyProjects.forEach((p) => {
      if (p.status === 'Concluído') counts['Concluído']++
      else if (p.status === 'Em Andamento' || p.status === 'Em Execução') counts['Em Andamento']++
      else counts['Pendente']++
    })

    const total = weeklyProjects.length || 1

    return [
      {
        status: 'Pendente',
        count: counts['Pendente'],
        percentage: Math.round((counts['Pendente'] / total) * 100),
        fill: 'var(--color-pendente)',
      },
      {
        status: 'Em Andamento',
        count: counts['Em Andamento'],
        percentage: Math.round((counts['Em Andamento'] / total) * 100),
        fill: 'var(--color-andamento)',
      },
      {
        status: 'Concluído',
        count: counts['Concluído'],
        percentage: Math.round((counts['Concluído'] / total) * 100),
        fill: 'var(--color-concluido)',
      },
    ]
  }, [weeklyProjects])

  const filteredProjects = useMemo(() => {
    const s = search.toLowerCase()
    const matchedClients = clients
      .filter(
        (c) => (c.name || '').toLowerCase().includes(s) || (c.code || '').toLowerCase().includes(s),
      )
      .map((c) => c.name)

    return myProjects.filter((p) => {
      const matchSearch =
        !s ||
        (p.name || '').toLowerCase().includes(s) ||
        (p.client || '').toLowerCase().includes(s) ||
        matchedClients.includes(p.client)

      let matchStatus = true
      if (projectStatusFilter === 'Pendentes') {
        matchStatus = p.status === 'Planejamento' || p.status === 'Pendente'
      } else if (projectStatusFilter === 'Em Andamento') {
        matchStatus = p.status === 'Em Andamento' || p.status === 'Em Execução'
      } else if (projectStatusFilter === 'Concluídos') {
        matchStatus = p.status === 'Concluído'
      }

      return matchSearch && matchStatus
    })
  }, [myProjects, search, clients, projectStatusFilter])

  const filteredModules = useMemo(() => {
    const s = search.toLowerCase()
    const today = new Date()
    return modules.filter((m) => {
      const projectName = m.expand?.project?.name || ''
      const matchesSearch =
        !s || projectName.toLowerCase().includes(s) || (m.name || '').toLowerCase().includes(s)

      const matchesStatus = statusFilter === 'Todos' || m.status === statusFilter

      let matchesDate = true
      if (m.deadline) {
        const deadlineDate = new Date(m.deadline)
        if (dateFilter === 'Atrasados')
          matchesDate = isBefore(deadlineDate, today) && m.status !== 'Concluído'
        else if (dateFilter === 'Proximos7')
          matchesDate = isAfter(deadlineDate, today) && isBefore(deadlineDate, addDays(today, 7))
        else if (dateFilter === 'Proximos30')
          matchesDate = isAfter(deadlineDate, today) && isBefore(deadlineDate, addDays(today, 30))
      } else if (dateFilter !== 'Todos') matchesDate = false

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [modules, search, statusFilter, dateFilter])

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [calendarMonth])

  const projectsByDate = useMemo(() => {
    const map: Record<string, any[]> = {}
    filteredProjects.forEach((p) => {
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
  }, [filteredProjects])

  const selectedDateProjects = useMemo(() => {
    if (!selectedDate) return []
    return projectsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
  }, [selectedDate, projectsByDate])

  const hasFinanceAccess = canAccess('lancamentos_financeiros') || user.role === 'Administrador'

  return (
    <div className="flex-1 space-y-6 p-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <LayoutDashboard className="h-6 w-6 text-amber-500" />
            </div>
            Resumo de Projeto (Meu Painel)
          </h2>
          <p className="text-zinc-400 mt-2">
            Olá, {user?.name}. Acompanhe o progresso dos seus projetos, disciplinas e prazos.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
          onClick={handlePrintWeeklyReport}
        >
          <Printer className="w-4 h-4 mr-2" />
          Relatório Semanal
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-zinc-900/50 backdrop-blur-md p-4 rounded-xl border border-zinc-800 shadow-sm">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Buscar projeto, cliente, disciplina..."
            className="pl-9 bg-zinc-950/50 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-zinc-500"
              onClick={() => setSearch('')}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full space-y-6">
        <TabsList className="bg-zinc-900/50 p-1 w-full justify-start overflow-x-auto h-auto flex-wrap border border-zinc-800">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500"
          >
            Visão Geral e Projetos
          </TabsTrigger>
          <TabsTrigger
            value="modules"
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500"
          >
            Minhas Disciplinas ({modules.length})
          </TabsTrigger>
          <TabsTrigger
            value="cronograma"
            className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500"
          >
            Cronograma
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 outline-none m-0">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-zinc-800/50 bg-zinc-950/50 md:col-span-2">
              <CardHeader className="pb-3 border-b border-zinc-800/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                    Progresso Semanal ({weeklyProjects.length} Projetos Ativos)
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Distribuição de status (%) dos projetos da semana atual
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="py-6">
                <ChartContainer
                  config={{
                    pendente: { label: 'Pendente', color: 'hsl(215 16.3% 46.9%)' },
                    andamento: { label: 'Em Andamento', color: 'hsl(38 92% 50%)' },
                    concluido: { label: 'Concluído', color: 'hsl(142 71% 45%)' },
                  }}
                  className="h-[120px] w-full"
                >
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="status"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      fontSize={12}
                      width={100}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <ChartTooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                      content={<ChartTooltipContent />}
                    />
                    <Bar dataKey="percentage" radius={[0, 4, 4, 0]} maxBarSize={20}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border-zinc-800/50 bg-zinc-950/50">
              <CardHeader className="pb-3 border-b border-zinc-800/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-indigo-400" />
                  Projetos Ativos
                </CardTitle>
                <CardDescription>Acompanhamento dos projetos que você faz parte</CardDescription>
              </CardHeader>
              <CardContent className="py-4 space-y-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  {['Todos', 'Pendentes', 'Em Andamento', 'Concluídos'].map((f) => (
                    <Button
                      key={f}
                      variant={projectStatusFilter === f ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setProjectStatusFilter(f)}
                      className={cn(
                        'rounded-full text-xs h-7',
                        projectStatusFilter === f
                          ? 'bg-amber-500 text-amber-950 hover:bg-amber-600 border-transparent'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800',
                      )}
                    >
                      {f}
                    </Button>
                  ))}
                </div>
                {filteredProjects.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-4">
                    Nenhum projeto vinculado a você com este filtro.
                  </p>
                )}
                {filteredProjects.map((project) => {
                  const critical =
                    project.status !== 'Concluído' &&
                    project.end_date &&
                    differenceInDays(
                      startOfDay(new Date(project.end_date)),
                      startOfDay(new Date()),
                    ) >= 0 &&
                    differenceInDays(
                      startOfDay(new Date(project.end_date)),
                      startOfDay(new Date()),
                    ) <= 3
                  const diffDays = project.end_date
                    ? differenceInDays(
                        startOfDay(new Date(project.end_date)),
                        startOfDay(new Date()),
                      )
                    : 0

                  return (
                    <div
                      key={project.id}
                      className={cn(
                        'p-4 rounded-lg bg-zinc-900 border',
                        critical ? 'border-rose-500/50 bg-rose-500/5' : 'border-zinc-800',
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-zinc-100 flex items-center gap-2">
                          {project.name}
                          {critical && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className="bg-rose-500/10 text-rose-500 border-rose-500/20 px-1.5 py-0 h-5 cursor-help"
                                  >
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Vence em breve
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Faltam {diffDays} dia(s) para a entrega</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'whitespace-nowrap font-medium',
                            getStatusColor(project.status),
                          )}
                        >
                          {getStatusIcon(project.status)}
                          {project.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-zinc-400 mb-1">
                        <span>Progresso Geral</span>
                        <span>{project.progress || 0}%</span>
                      </div>
                      <Progress value={project.progress || 0} className="h-1.5 mb-3" />

                      <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
                        {hasFinanceAccess && project.budget > 0 ? (
                          <div className="space-y-1 flex-1 mr-4">
                            <div className="flex justify-between text-xs text-zinc-400 font-medium">
                              <span>Orçamento: R$ {project.budget?.toLocaleString('pt-BR')}</span>
                              <span>Gasto: R$ {project.spent?.toLocaleString('pt-BR')}</span>
                            </div>
                            <Progress
                              value={Math.min(100, ((project.spent || 0) / project.budget) * 100)}
                              className="h-1.5 [&>div]:bg-amber-500 bg-zinc-800"
                            />
                          </div>
                        ) : (
                          <div className="flex-1" />
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
                          onClick={() => setUploadProject(project)}
                        >
                          <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                          Upload Rápido
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-zinc-800/50 bg-zinc-950/50">
              <CardHeader className="pb-3 border-b border-zinc-800/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-emerald-400" />
                  Próximas Tarefas e Prazos
                </CardTitle>
                <CardDescription>Tarefas pendentes atribuídas a você</CardDescription>
              </CardHeader>
              <CardContent className="py-4 space-y-3">
                {tasks.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-4">Nenhuma tarefa pendente.</p>
                )}
                {tasks.slice(0, 10).map((task) => {
                  const isLate = task.due_date && new Date(task.due_date) < new Date()
                  return (
                    <div
                      key={task.id}
                      className="flex flex-col p-3 rounded-lg bg-zinc-900 border border-zinc-800 gap-1.5"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm text-zinc-200">{task.title}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {task.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-zinc-500">
                        <span className="truncate max-w-[150px]">
                          {task.expand?.project?.name || 'Sem projeto'}
                        </span>
                        <span className={isLate ? 'text-rose-400 font-medium' : 'text-zinc-400'}>
                          {task.due_date
                            ? format(new Date(task.due_date), 'dd/MM/yyyy')
                            : 'Sem prazo'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6 outline-none m-0">
          <div className="flex justify-end gap-4 w-full mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos Status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Prazo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos Prazos</SelectItem>
                <SelectItem value="Atrasados">Atrasados</SelectItem>
                <SelectItem value="Proximos7">Próx. 7 dias</SelectItem>
                <SelectItem value="Proximos30">Próx. 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredModules.map((mod) => (
                <Card
                  key={mod.id}
                  className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow border-zinc-800/50"
                >
                  <CardHeader className="pb-4 border-b border-zinc-800/50">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5 flex-1 pr-2">
                        <CardTitle className="text-lg leading-tight line-clamp-1 text-zinc-100">
                          {mod.name}
                        </CardTitle>
                        <CardDescription className="font-medium text-zinc-400 line-clamp-1">
                          Projeto: {mod.expand?.project?.name || 'N/A'}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(mod.status)} variant="outline">
                        {getStatusIcon(mod.status)}
                        {mod.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="py-5 flex-1 space-y-5">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-400 flex items-center gap-1.5">
                          <CalendarIcon className="h-4 w-4" /> Prazo
                        </span>
                        <span
                          className={
                            mod.deadline &&
                            new Date(mod.deadline) < new Date() &&
                            mod.status !== 'Concluído'
                              ? 'text-rose-400 font-medium'
                              : 'text-zinc-300'
                          }
                        >
                          {mod.deadline
                            ? format(new Date(mod.deadline), 'dd MMM, yyyy', { locale: ptBR })
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-400 flex items-center gap-1.5">
                          <Clock className="h-4 w-4" /> Últ. Ativ.
                        </span>
                        <span className="font-medium text-zinc-300">
                          {format(new Date(mod.updated), 'dd/MM/yy HH:mm')}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-zinc-400">Progresso</span>
                        <span
                          className={mod.progress === 100 ? 'text-emerald-400' : 'text-amber-500'}
                        >
                          {mod.progress || 0}%
                        </span>
                      </div>
                      <Progress value={mod.progress || 0} className="h-2" />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4 border-t border-zinc-800/50 bg-zinc-950/30 flex flex-wrap gap-2">
                    <Button asChild variant="default" className="flex-1 min-w-[120px]">
                      <Link to={`/projects/${mod.project}/disciplines/${mod.id}`}>
                        Acessar Disciplina
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 min-w-[120px]"
                      onClick={() => {
                        setSelectedProjectForHours(mod)
                        setIsHoursDialogOpen(true)
                      }}
                    >
                      <Clock className="h-4 w-4 mr-2 text-amber-500" />
                      Lançar Horas
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              {filteredModules.length === 0 && (
                <div className="col-span-full py-16 text-center bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
                  <HardHat className="h-8 w-8 text-zinc-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-zinc-100 mb-2">
                    Nenhuma disciplina encontrada
                  </h3>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cronograma" className="space-y-6 outline-none m-0">
          <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
            <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-amber-500" />
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

          {filteredProjects.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
              <CalendarIcon className="h-8 w-8 text-zinc-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-100 mb-2">
                Nenhum projeto ativo no cronograma
              </h3>
              <p className="text-sm text-zinc-400">
                Você não tem projetos associados ou eles não possuem datas definidas.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950/50">
                <div className="grid grid-cols-7 bg-zinc-900/80 border-b border-zinc-800">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                    <div key={d} className="p-3 text-center text-sm font-medium text-zinc-400">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-zinc-800 auto-rows-fr">
                  {calendarDays.map((day, i) => {
                    const key = format(day, 'yyyy-MM-dd')
                    const dayProjects = projectsByDate[key] || []
                    return (
                      <div
                        key={i}
                        className={cn(
                          'min-h-[120px] p-2 bg-zinc-950 transition-colors flex flex-col gap-1',
                          !isSameMonth(day, calendarMonth) && 'bg-zinc-900/50 opacity-60',
                        )}
                      >
                        <div className="flex justify-end mb-1">
                          <span
                            className={cn(
                              'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                              isToday(day)
                                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                                : 'text-zinc-400',
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
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : p.is_priority
                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-medium'
                                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                                  )}
                                >
                                  {p.name}
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 bg-zinc-950 border-zinc-800">
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="font-semibold text-sm text-zinc-100">
                                      {p.name}
                                    </h4>
                                    <p className="text-xs text-zinc-400 mt-0.5">
                                      Cliente: {p.client || 'N/A'}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between text-xs font-medium">
                                    <span className="text-zinc-400">Progresso</span>
                                    <span className="text-amber-500">{p.progress || 0}%</span>
                                  </div>
                                  <Progress value={p.progress || 0} className="h-1.5" />
                                  <div className="pt-2 flex justify-end">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      asChild
                                      className="h-7 text-xs"
                                    >
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
                <Card className="border-zinc-800 bg-zinc-950 p-2 w-full flex justify-center shadow-md">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md"
                    modifiers={{
                      active: (d) => !!projectsByDate[format(d, 'yyyy-MM-dd')],
                    }}
                    modifiersClassNames={{
                      active: 'font-bold text-amber-500 bg-amber-500/10',
                    }}
                  />
                </Card>
                <div className="w-full space-y-3">
                  <h4 className="font-medium text-sm text-zinc-400">
                    Projetos em {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''}
                  </h4>
                  {selectedDateProjects.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-4 bg-zinc-900/30 rounded-lg border border-zinc-800 border-dashed">
                      Nenhum projeto ativo nesta data.
                    </p>
                  ) : (
                    selectedDateProjects.map((p) => (
                      <Card key={p.id} className="border-zinc-800 bg-zinc-950/50">
                        <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
                          <div className="font-medium text-sm truncate flex-1 pr-2">{p.name}</div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'whitespace-nowrap font-medium',
                              getStatusColor(p.status),
                            )}
                          >
                            {getStatusIcon(p.status)}
                            {p.status}
                          </Badge>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <p className="text-xs text-zinc-400 mb-2">Cliente: {p.client || 'N/A'}</p>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Progresso</span>
                            <span>{p.progress || 0}%</span>
                          </div>
                          <Progress value={p.progress || 0} className="h-1 mb-3" />
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="w-full h-8 text-xs"
                          >
                            <Link to={`/projects/${p.id}`}>Ver Detalhes</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isHoursDialogOpen} onOpenChange={setIsHoursDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Horas Trabalhadas</DialogTitle>
            <DialogDescription>Insira o tempo dedicado a esta disciplina.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Input
                value={selectedProjectForHours?.name || ''}
                readOnly
                disabled
                className="bg-zinc-900 font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data da Atividade *</Label>
              <Input
                id="date"
                type="date"
                value={hoursLog.date}
                onChange={(e) => setHoursLog({ ...hoursLog, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Hora de Início *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={hoursLog.startTime}
                  onChange={(e) => setHoursLog({ ...hoursLog, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Hora de Término *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={hoursLog.endTime}
                  onChange={(e) => setHoursLog({ ...hoursLog, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Atividade *</Label>
              <Textarea
                id="description"
                placeholder="Resumo do trabalho..."
                className="resize-none h-24"
                value={hoursLog.description}
                onChange={(e) => setHoursLog({ ...hoursLog, description: e.target.value })}
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

      <Dialog open={!!uploadProject} onOpenChange={(o) => !o && setUploadProject(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Rápido de Documento</DialogTitle>
            <DialogDescription>
              Anexe fotos ou arquivos de campo diretamente ao projeto{' '}
              <strong>{uploadProject?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Arquivo (JPG, PNG, PDF)</Label>
              <Input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                disabled={uploading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUploadProject(null)} disabled={uploading}>
              Cancelar
            </Button>
            <Button onClick={handleQuickUpload} disabled={!uploadFile || uploading}>
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4 mr-2" />
              )}
              {uploading ? 'Enviando...' : 'Enviar Documento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PrintWeeklyReport projects={myProjects} userName={user?.name || ''} printMode={printMode} />
    </div>
  )
}
