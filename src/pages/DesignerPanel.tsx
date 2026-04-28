import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  Loader2,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileText,
  GripHorizontal,
} from 'lucide-react'
import {
  format,
  isAfter,
  isBefore,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { usePermissions } from '@/hooks/use-permissions'
import { cn } from '@/lib/utils'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { exportDesignerDashboardPDF } from '@/lib/exportPdf'
import { PlanilhaFinanceira } from '@/components/meu-painel/PlanilhaFinanceira'
import { MyTasksList } from '@/components/meu-painel/MyTasksList'

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

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Baixa':
      return 'bg-slate-500/10 text-slate-500 border-slate-500/20 dark:text-slate-400'
    case 'Média':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400'
    case 'Alta':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-500'
    case 'Urgente':
      return 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-500'
    default:
      return 'bg-slate-500/10 text-slate-500 border-slate-500/20 dark:text-slate-400'
  }
}

export default function DesignerPanel() {
  const { user } = useAuth()
  const { canAccess } = usePermissions()
  const { toast } = useToast()

  const [myProjects, setMyProjects] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [urgentTasks, setUrgentTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const [exportingDocs, setExportingDocs] = useState(false)
  const [layout, setLayout] = useState<string[]>(['daily', 'overview', 'cronograma', 'financeiro'])

  useEffect(() => {
    if (user?.ui_preferences?.designerLayout) {
      setLayout(user.ui_preferences.designerLayout)
    }
  }, [user])

  const hasFinanceAccess = canAccess('planilha_financeira') || user?.role === 'Administrador'

  const availableWidgets = useMemo(() => {
    const defaults = ['daily', 'overview', 'cronograma', 'financeiro']
    const current = [...layout]
    defaults.forEach((d) => {
      if (!current.includes(d)) current.push(d)
    })
    return current.filter((id) => id !== 'financeiro' || hasFinanceAccess)
  }, [layout, hasFinanceAccess])

  const handleExportDashboard = async () => {
    setExportingDocs(true)
    try {
      let financeData = null
      if (hasFinanceAccess) {
        const servicos = await pb
          .collection('servicos_financeiros')
          .getFullList({ filter: `user_id = "${user.id}"` })
        const pgs = await pb
          .collection('pagamentos_servicos')
          .getFullList({ filter: `servico_id.user_id = "${user.id}"` })

        const totalGeral = servicos
          .filter((s) => s.status !== 'Cancelado')
          .reduce((acc, s) => acc + (s.valor_total || 0), 0)
        const totalPago = pgs.reduce((acc, p) => acc + (p.valor || 0), 0)
        financeData = { total: totalGeral, recebido: totalPago, aReceber: totalGeral - totalPago }
      }

      let companySettings = null
      try {
        companySettings = await pb.collection('company_settings').getFirstListItem('')
      } catch {
        /* intentionally ignored */
      }

      exportDesignerDashboardPDF(user, myProjects, urgentTasks, financeData, companySettings)
      toast({ title: 'Relatório exportado com sucesso!' })
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao gerar relatório',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setExportingDocs(false)
    }
  }

  const loadData = async () => {
    if (!user) return
    try {
      setLoading(true)
      const [upaRes, clientsRes] = await Promise.all([
        pb.collection('user_project_access').getFullList({
          filter: `user = "${user.id}"`,
        }),
        pb.collection('clients').getFullList(),
      ])

      setClients(clientsRes)

      let assignedProjectIds = user.assigned_projects || []
      const accessProjectIds = upaRes.map((u) => u.project)
      const allProjectIds = Array.from(new Set([...assignedProjectIds, ...accessProjectIds]))

      let projectFilter = `engineer ~ "${user.name}" || engineer = "${user.id}"`
      if (allProjectIds.length > 0) {
        const idsFilter = allProjectIds.map((id) => `id="${id}"`).join(' || ')
        projectFilter = `(${projectFilter}) || (${idsFilter})`
      }

      const projectsRes = await pb.collection('projects').getFullList({
        filter: projectFilter,
        sort: '-created',
      })
      setMyProjects(projectsRes)

      const next24h = new Date()
      next24h.setHours(next24h.getHours() + 24)
      const filterDate = next24h.toISOString().replace('T', ' ')

      const tasksRes = await pb.collection('tasks').getFullList({
        filter: `responsible = "${user.id}" && status != "Concluído" && due_date != "" && due_date <= "${filterDate}"`,
        expand: 'project',
        sort: 'due_date',
      })
      setUrgentTasks(tasksRes)
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
  useRealtime('projects', loadData, !!user?.id)
  useRealtime('clients', loadData, !!user?.id)
  useRealtime('tasks', loadData, !!user?.id)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    if (!draggedId || draggedId === targetId) return

    const newLayout = [...layout]
    const draggedIndex = newLayout.indexOf(draggedId)
    const targetIndex = newLayout.indexOf(targetId)

    newLayout.splice(draggedIndex, 1)
    newLayout.splice(targetIndex, 0, draggedId)

    setLayout(newLayout)

    if (user) {
      try {
        const uiPrefs = user.ui_preferences || {}
        await pb.collection('users').update(user.id, {
          ui_preferences: {
            ...uiPrefs,
            designerLayout: newLayout,
          },
        })
      } catch (err) {
        console.error('Erro ao salvar layout', err)
      }
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
    return myProjects
  }, [myProjects])

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

  const renderWidget = (id: string) => {
    let content = null
    switch (id) {
      case 'daily':
        content = (
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-100">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              Atividades do Dia (Urgentes)
            </h3>
            {urgentTasks.length === 0 ? (
              <div className="text-center py-8 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-3 opacity-50" />
                <p className="text-sm text-zinc-400">
                  Tudo em dia! Nenhuma atividade urgente para as próximas 24 horas.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {urgentTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'whitespace-nowrap',
                          getPriorityColor(t.priority || 'Urgente'),
                        )}
                      >
                        {t.priority || 'Urgente'}
                      </Badge>
                      <span className="text-xs font-medium text-zinc-500 bg-zinc-950 px-2 py-1 rounded-md">
                        {new Date(t.due_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="font-semibold text-zinc-100 text-sm mb-1 leading-snug">
                      {t.title}
                    </p>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <LayoutDashboard className="w-3.5 h-3.5 opacity-70" />
                      {t.expand?.project?.name || 'Projeto não especificado'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
        break
      case 'overview':
        content = (
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-100">
              <LayoutDashboard className="h-5 w-5 text-amber-500" />
              Dashboards de Gestão
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-zinc-800/50 bg-zinc-950/50 md:col-span-2">
                <CardHeader className="pb-3 border-b border-zinc-800/50 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-amber-500" />
                      Métricas de Eficiência (Semana Atual)
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Distribuição de status (%) dos {weeklyProjects.length} projetos com atividades
                      nesta semana
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

              <div className="md:col-span-2">
                <MyTasksList />
              </div>
            </div>
          </div>
        )
        break
      case 'cronograma':
        content = (
          <div className="space-y-6">
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
              <div className="w-full">
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
                            <p className="text-xs text-zinc-400 mb-2">
                              Cliente: {p.client || 'N/A'}
                            </p>
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
              </div>
            )}
          </div>
        )
        break
      case 'financeiro':
        content = (
          <div className="space-y-4">
            <PlanilhaFinanceira />
          </div>
        )
        break
    }

    if (!content) return null

    return (
      <div
        key={id}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, id)}
        className="mb-8 border border-zinc-800 rounded-xl bg-zinc-950/30 overflow-hidden shadow-lg transition-all"
      >
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, id)}
          className="cursor-move p-1 bg-zinc-900 border-b border-zinc-800 flex justify-center items-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          title="Arraste para reordenar"
        >
          <GripHorizontal className="w-5 h-5 opacity-70" />
        </div>
        <div className="p-4 md:p-6">{content}</div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <LayoutDashboard className="h-6 w-6 text-amber-500" />
            </div>
            Resumo de Projeto (Meu Painel)
          </h2>
          <p className="text-zinc-400 mt-2">
            Olá, {user?.name}. Acompanhe o progresso dos seus projetos, cronogramas e prazos.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap md:flex-nowrap">
          <Button
            variant="default"
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-md"
            onClick={handleExportDashboard}
            disabled={exportingDocs}
          >
            {exportingDocs ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Exportar Relatório
          </Button>
        </div>
      </div>

      <div className="space-y-2">{availableWidgets.map((id) => renderWidget(id))}</div>
    </div>
  )
}
