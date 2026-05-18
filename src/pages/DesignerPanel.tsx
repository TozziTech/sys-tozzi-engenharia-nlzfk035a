import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
  Info,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useQuery, queryClient } from '@/hooks/use-query'
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
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { usePermissions } from '@/hooks/use-permissions'
import { cn } from '@/lib/utils'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, ReferenceLine } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { exportDesignerDashboardPDF } from '@/lib/exportPdf'
import { ServicosList } from '@/components/financial/ServicosList'
import { MyTasksList } from '@/components/meu-painel/MyTasksList'
import { ArrowRight, Edit } from 'lucide-react'
import { EditTaskDialog } from '@/components/EditTaskDialog'

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
      return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20'
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
      return 'bg-muted text-muted-foreground border-border'
    case 'Média':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'Alta':
      return 'bg-primary/10 text-primary border-primary/20'
    case 'Urgente':
      return 'bg-destructive/10 text-destructive border-destructive/20'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const EMPTY_ARRAY: any[] = []

export default function DesignerPanel() {
  const { user } = useAuth()
  const { canAccess } = usePermissions()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'gerenciamento'

  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const [exportingDocs, setExportingDocs] = useState(false)
  const hasShownDailySummary = useRef(false)
  const [showDailySummary, setShowDailySummary] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  const hasFinanceAccess = canAccess('planilha_financeira') || user?.role === 'Administrador'

  const handleTaskToggle = async (task: any, checked: boolean) => {
    try {
      const newStatus = checked ? 'Concluído' : 'Pendente'
      const completedAt = checked ? new Date().toISOString() : null

      if (task.type === 'task' || task.source === 'Tarefa Geral') {
        await pb.collection('tasks').update(task.id, {
          status: newStatus,
          completed_at: completedAt,
        })
      } else if (task.source === 'Checklist de Projeto' || task.is_admin_checklist) {
        await pb.collection('project_admin_checklist').update(task.id, {
          status: newStatus,
          is_completed: checked,
        })
      } else if (task.source === 'Tarefa Hierárquica') {
        await pb.collection('tarefas_hierarquicas').update(task.id, {
          concluida: checked,
        })
      }

      toast({
        title: `Tarefa ${checked ? 'concluída' : 'reaberta'} com sucesso!`,
      })
    } catch (error: any) {
      const fieldErrors = extractFieldErrors(error)
      const errorMsg =
        Object.keys(fieldErrors).length > 0
          ? Object.entries(fieldErrors)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ')
          : error.message || 'Erro desconhecido'

      toast({
        title: 'Erro ao atualizar tarefa',
        description: errorMsg,
        variant: 'destructive',
      })
    }
  }

  const canToggleTask = (task: any) => {
    if (user?.role === 'Administrador' || user?.role === 'Gerente de Projeto') return true
    return task.responsible === user?.id
  }

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
          .getFullList({ filter: `user_id = "${user.id}" && status = "Pago"` })

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

  const { data: myProjects = EMPTY_ARRAY, refetch: refetchProjects } = useQuery(
    `designer_projects_${user?.id}`,
    async () => {
      if (!user) return []
      const upaRes = await pb.collection('user_project_access').getFullList({
        filter: `user = "${user.id}"`,
      })
      const assignedProjectIds = user.assigned_projects || []
      const accessProjectIds = upaRes.map((u: any) => u.project)
      const allProjectIds = Array.from(new Set([...assignedProjectIds, ...accessProjectIds]))

      let projectFilter = `engineer ~ "${user.name}" || engineer = "${user.id}"`
      if (allProjectIds.length > 0) {
        const idsFilter = allProjectIds.map((id) => `id="${id}"`).join(' || ')
        projectFilter = `(${projectFilter}) || (${idsFilter})`
      }

      return pb.collection('projects').getFullList({
        filter: projectFilter,
        sort: '-created',
      })
    },
    { enabled: !!user },
  )

  const { data: urgentTasks = EMPTY_ARRAY, refetch: refetchTasks } = useQuery(
    `designer_urgent_tasks_${user?.id}`,
    async () => {
      if (!user) return []

      const upaRes = await pb.collection('user_project_access').getFullList({
        filter: `user = "${user.id}"`,
      })
      const assignedProjectIds = user.assigned_projects || []
      const accessProjectIds = upaRes.map((u: any) => u.project)
      const allProjectIds = Array.from(new Set([...assignedProjectIds, ...accessProjectIds]))

      let projectFilter = `(projeto_id.engineer ~ "${user.name}" || projeto_id.engineer = "${user.id}")`
      if (allProjectIds.length > 0) {
        const idsFilter = allProjectIds.map((id) => `projeto_id="${id}"`).join(' || ')
        projectFilter = `(${projectFilter}) || (${idsFilter})`
      }

      const [tasks, checklists, hierarquicas] = await Promise.all([
        pb.collection('tasks').getFullList({
          filter: `responsible = "${user.id}" && status != "Concluído"`,
          expand: 'project',
        }),
        pb.collection('project_admin_checklist').getFullList({
          filter: `responsible = "${user.id}" && status != "Concluído" && status != "Cancelado"`,
          expand: 'project',
        }),
        pb.collection('tarefas_hierarquicas').getFullList({
          filter: `concluida = false && (${projectFilter})`,
          expand: 'projeto_id',
        }),
      ])

      const mappedChecklists = checklists.map((c) => ({
        ...c,
        title: c.item,
        due_date: c.deadline,
        is_admin_checklist: true,
      }))

      const mappedHierarquicas = hierarquicas.map((h) => ({
        id: h.id,
        title: h.titulo,
        due_date: null,
        status: 'Pendente',
        priority: 'Média',
        expand: { project: h.expand?.projeto_id },
      }))

      const combined = [
        ...tasks.map((t) => ({ ...t, source: 'Tarefa Geral' })),
        ...mappedChecklists.map((c) => ({ ...c, source: 'Checklist de Projeto' })),
        ...mappedHierarquicas.map((h) => ({ ...h, source: 'Tarefa Hierárquica' })),
      ]
      combined.sort((a, b) => {
        const dateA = a.due_date ? new Date(a.due_date).getTime() : 0
        const dateB = b.due_date ? new Date(b.due_date).getTime() : 0

        if (dateA === 0 && dateB !== 0) return -1
        if (dateB === 0 && dateA !== 0) return 1
        if (dateA === 0 && dateB === 0) return 0

        return dateA - dateB
      })
      return combined
    },
    { enabled: !!user },
  )

  const { data: allServicos = EMPTY_ARRAY } = useQuery(
    `servicos_financeiros_user_${user?.id}`,
    () =>
      pb.collection('servicos_financeiros').getFullList({
        filter: `user_id = "${user?.id}"`,
        sort: '-created',
      }),
    { enabled: !!user && hasFinanceAccess },
  )

  const allPagamentos = useMemo(() => {
    const pgs: any[] = []
    allServicos.forEach((s) => {
      if (s.parcelas && Array.isArray(s.parcelas)) {
        s.parcelas.forEach((p) => {
          pgs.push({
            ...p,
            servico_id: s.id,
            servico_descricao: s.projeto_servico,
          })
        })
      }
    })
    return pgs
  }, [allServicos])

  const revenueData = useMemo(
    () => allPagamentos.filter((p: any) => p.status === 'Pago'),
    [allPagamentos],
  )

  const urgentPayments = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const filtered = allPagamentos.filter((p: any) => {
      if (p.status !== 'Pendente' || !p.data_vencimento) return false
      const venc = new Date(p.data_vencimento)
      venc.setHours(12, 0, 0, 0)
      venc.setHours(0, 0, 0, 0)
      return venc <= today
    })

    return filtered
      .map((p: any) => {
        const venc = new Date(p.data_vencimento)
        venc.setHours(12, 0, 0, 0)
        venc.setHours(0, 0, 0, 0)
        return {
          ...p,
          isOverdue: venc < today,
          isDueToday: venc.getTime() === today.getTime(),
        }
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime(),
      )
  }, [allPagamentos])

  useEffect(() => {
    if (hasFinanceAccess && urgentPayments.length > 0 && !hasShownDailySummary.current) {
      setShowDailySummary(true)
      hasShownDailySummary.current = true
    }
  }, [urgentPayments.length, hasFinanceAccess])

  const { data: upcomingDeadlines = [] } = useQuery(
    `designer_upcoming_${user?.id}`,
    async () => {
      if (!user) return []
      const [tasksRes, modulesRes] = await Promise.all([
        pb.collection('tasks').getFullList({
          filter: `responsible = "${user.id}" && status != "Concluído"`,
          expand: 'project',
        }),
        pb.collection('project_modules').getFullList({
          filter: `responsible = "${user.id}" && status != "Concluído"`,
          expand: 'project',
        }),
      ])

      const combined = [
        ...tasksRes.map((t) => ({
          id: t.id,
          title: t.title,
          date: t.due_date,
          project: t.expand?.project,
          type: 'task',
          status: t.status,
          responsible: t.responsible,
        })),
        ...modulesRes.map((m) => ({
          id: m.id,
          title: m.name,
          date: m.deadline,
          project: m.expand?.project,
          type: 'module',
        })),
      ].filter((x) => x.date)

      combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      return combined.slice(0, 10)
    },
    { enabled: !!user },
  )

  const { overdueCount, dueSoonCount } = useMemo(() => {
    let overdue = 0
    let dueSoon = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const in3Days = new Date(today)
    in3Days.setDate(today.getDate() + 3)

    allPagamentos.forEach((p: any) => {
      if (p.status === 'Pendente' && p.data_vencimento) {
        const venc = new Date(p.data_vencimento)
        venc.setHours(12, 0, 0, 0)
        if (venc < today) overdue++
        else if (venc <= in3Days) dueSoon++
      }
    })
    return { overdueCount: overdue, dueSoonCount: dueSoon }
  }, [allPagamentos])

  useRealtime('projects', refetchProjects, !!user?.id)
  useRealtime('user_project_access', refetchProjects, !!user?.id)
  useRealtime('tasks', refetchTasks, !!user?.id)
  useRealtime('project_admin_checklist', refetchTasks, !!user?.id)
  useRealtime('tarefas_hierarquicas', refetchTasks, !!user?.id)

  const chartData = useMemo(() => {
    const counts = { Pendente: 0, 'Em Andamento': 0, Concluído: 0 }
    myProjects.forEach((p) => {
      if (p.status === 'Concluído') counts['Concluído']++
      else if (p.status === 'Em Andamento' || p.status === 'Em Execução') counts['Em Andamento']++
      else counts['Pendente']++
    })

    const total = myProjects.length || 1

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
  }, [])

  const monthlyRevenue = useMemo(() => {
    const now = new Date()
    const from = startOfYear(now)
    const to = endOfYear(now)

    const monthsMap = new Map()
    const interval = eachMonthOfInterval({ start: from, end: to })
    interval.forEach((d) => {
      const key = format(d, 'yyyy-MM')
      monthsMap.set(key, {
        month: format(d, 'MMM/yy', { locale: ptBR }),
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        total: 0,
      })
    })

    revenueData.forEach((p) => {
      if (!p.data_pagamento) return
      const d = new Date(p.data_pagamento)
      d.setHours(d.getHours() + 12)
      if (d >= from && d <= to) {
        const key = format(d, 'yyyy-MM')
        if (monthsMap.has(key)) {
          monthsMap.get(key).total += p.valor
        }
      }
    })

    return Array.from(monthsMap.values())
  }, [revenueData])

  const averageRevenue = useMemo(() => {
    if (!monthlyRevenue.length) return 0
    const sum = monthlyRevenue.reduce((acc, m) => acc + m.total, 0)
    return sum / monthlyRevenue.length
  }, [monthlyRevenue])

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

  return (
    <div className="flex-1 space-y-6 p-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            Resumo de Projeto (Meu Painel)
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
            <p className="text-muted-foreground">
              Olá, {user?.name}. Acompanhe o progresso dos seus projetos, cronogramas e prazos.
            </p>
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary hover:bg-primary/20 w-fit"
            >
              {urgentTasks.length}{' '}
              {urgentTasks.length === 1 ? 'Tarefa Pendente' : 'Tarefas Pendentes'}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button
            variant="outline"
            className="border-border bg-background text-foreground hidden md:flex shadow-sm hover:bg-muted/50"
            onClick={() => {
              queryClient().invalidateQueries('')
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2 text-muted-foreground" />
            Atualizar
          </Button>

          <Button
            variant="default"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md w-full md:w-auto"
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

      <Tabs
        value={activeTab}
        onValueChange={(v) => setSearchParams({ tab: v })}
        className="w-full space-y-6"
      >
        <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex min-w-max h-11 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground border border-border">
            <TabsTrigger
              value="gerenciamento"
              className="rounded-sm px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border"
            >
              Gerenciamento
            </TabsTrigger>
            {hasFinanceAccess && (
              <TabsTrigger
                value="financeiro"
                className="rounded-sm px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border"
              >
                Financeiro
              </TabsTrigger>
            )}
            <TabsTrigger
              value="cronograma"
              className="rounded-sm px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border"
            >
              Cronograma de Projetos
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="gerenciamento" className="space-y-6 outline-none">
          {hasFinanceAccess && (overdueCount > 0 || dueSoonCount > 0) && (
            <div className="grid gap-3 md:grid-cols-2 mb-2">
              {overdueCount > 0 && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                  <AlertCircle className="h-5 w-5 !text-destructive" />
                  <AlertTitle className="font-semibold text-destructive">
                    Pagamentos Atrasados
                  </AlertTitle>
                  <AlertDescription className="text-destructive mt-1">
                    Você tem {overdueCount} parcela{overdueCount > 1 ? 's' : ''} de serviço
                    financeiro em atraso.
                  </AlertDescription>
                </Alert>
              )}
              {dueSoonCount > 0 && (
                <Alert className="bg-primary/10 border-primary/20">
                  <AlertTriangle className="h-5 w-5 !text-primary" />
                  <AlertTitle className="font-semibold text-primary">
                    Pagamentos Vencendo
                  </AlertTitle>
                  <AlertDescription className="text-primary mt-1">
                    Você tem {dueSoonCount} parcela{dueSoonCount > 1 ? 's' : ''} de serviço
                    financeiro vencendo nos próximos 3 dias.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Atividades em Andamento
              </h3>
              {urgentTasks.length === 0 ? (
                <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-900/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Nenhum registro pendente encontrado.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {urgentTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 hover:border-primary/50 hover:shadow-md transition-all shadow-sm flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Checkbox
                            checked={t.status === 'Concluído'}
                            disabled={!canToggleTask(t)}
                            onCheckedChange={(checked) => handleTaskToggle(t, checked as boolean)}
                            className="w-5 h-5 rounded-full data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 transition-colors shadow-sm"
                          />
                          <Badge
                            variant="outline"
                            className={cn(
                              'whitespace-nowrap',
                              getPriorityColor(t.priority || 'Urgente'),
                            )}
                          >
                            {t.priority || 'Urgente'}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] whitespace-nowrap hidden sm:inline-flex shadow-sm',
                              t.source === 'Checklist de Projeto'
                                ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20'
                                : t.source === 'Tarefa Hierárquica'
                                  ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20'
                                  : 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
                            )}
                          >
                            {t.source}
                          </Badge>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={cn(
                              'text-xs font-medium px-2 py-1 rounded-md border whitespace-nowrap',
                              t.due_date
                                ? 'text-muted-foreground bg-background border-border'
                                : 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/30 dark:border-rose-900',
                            )}
                          >
                            {t.due_date
                              ? new Date(t.due_date).toLocaleDateString('pt-BR')
                              : 'Sem Data'}
                          </span>
                          {t.source === 'Tarefa Geral' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.preventDefault()
                                setEditingTaskId(t.id)
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="font-semibold text-foreground text-sm mb-1 leading-snug">
                        {t.title}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <LayoutDashboard className="w-3.5 h-3.5 opacity-70" />
                        {t.expand?.project?.name || 'Projeto não especificado'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <CalendarIcon className="h-5 w-5 text-amber-500" />
                Próximos Vencimentos
              </h3>
              <Card className="border-border bg-card">
                <CardContent className="p-0">
                  {upcomingDeadlines.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum vencimento próximo encontrado.
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {upcomingDeadlines.map((item: any) => {
                        const date = new Date(item.date)
                        date.setHours(23, 59, 59)
                        const diffHours = (date.getTime() - new Date().getTime()) / (1000 * 60 * 60)
                        const isUrgent = diffHours <= 48
                        const isOverdue = diffHours < 0

                        return (
                          <Link
                            to={
                              item.type === 'module'
                                ? `/projects/${item.project?.id}/disciplines/${item.id}`
                                : `/projects/${item.project?.id}`
                            }
                            key={`${item.type}-${item.id}`}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0 pr-4 flex items-center gap-3">
                              {item.type === 'task' && (
                                <div onClick={(e) => e.preventDefault()}>
                                  <Checkbox
                                    checked={item.status === 'Concluído'}
                                    disabled={!canToggleTask(item)}
                                    onCheckedChange={(checked) =>
                                      handleTaskToggle(item, checked as boolean)
                                    }
                                    className="w-5 h-5 rounded-full data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 transition-colors mt-0.5 shadow-sm"
                                  />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p
                                  className={cn(
                                    'font-medium text-sm truncate',
                                    isUrgent || isOverdue ? 'text-destructive' : 'text-foreground',
                                  )}
                                >
                                  {item.title}
                                </p>
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                  <span
                                    className={cn(
                                      'w-2 h-2 rounded-full',
                                      item.type === 'module' ? 'bg-indigo-500' : 'bg-emerald-500',
                                    )}
                                  />
                                  {item.type === 'module' ? 'Disciplina' : 'Tarefa'} •{' '}
                                  {item.project?.name || 'Projeto Desconhecido'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-2 sm:mt-0 shrink-0 relative">
                              {item.type === 'task' && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 group-hover:-translate-x-4 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setEditingTaskId(item.id)
                                    }}
                                    className="h-8 shadow-sm"
                                  >
                                    <Edit className="w-3.5 h-3.5 mr-1.5" /> Editar
                                  </Button>
                                </div>
                              )}
                              <div className="flex items-center gap-3 transition-transform duration-200 group-hover:-translate-x-24">
                                <Badge
                                  variant={
                                    isOverdue ? 'destructive' : isUrgent ? 'outline' : 'secondary'
                                  }
                                  className={cn(
                                    isUrgent &&
                                      !isOverdue &&
                                      'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-500/10',
                                  )}
                                >
                                  {isOverdue ? 'Atrasado' : isUrgent ? 'Urgente' : 'No Prazo'}
                                </Badge>
                                <div className="flex flex-col items-end">
                                  <span
                                    className={cn(
                                      'text-sm font-medium',
                                      (isUrgent || isOverdue) && 'text-destructive',
                                    )}
                                  >
                                    {date.toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground ml-1" />
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              Métricas de Eficiência
            </h3>
            <Card className="border-border bg-card">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-lg text-foreground">Geral</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Distribuição de status (%) dos {myProjects.length} projetos com atividades
                </CardDescription>
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
          </div>

          <MyTasksList />
        </TabsContent>

        {hasFinanceAccess && (
          <TabsContent value="financeiro" className="space-y-6 outline-none">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="bg-blue-500/5 border-blue-500/20 md:col-span-1 h-fit">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-500">
                    <Info className="h-4 w-4" />
                    Guia Rápido de Lançamentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-blue-500/80 space-y-3">
                  <p>
                    1. <strong>Novo Lançamento:</strong> Registre o valor total do serviço. O código
                    é gerado sequencialmente de forma automática.
                  </p>
                  <p>
                    2. <strong>Vínculo:</strong> O serviço agora pode ser vinculado a um de seus
                    projetos ativos, melhorando a rastreabilidade.
                  </p>
                  <p>
                    3. <strong>Histórico:</strong> Todos os lançamentos passados são exibidos nesta
                    tabela, sem filtro de data, para visão global.
                  </p>
                  <p>
                    4. <strong>Autonomia:</strong> Os registros de pagamentos são agora gerenciados
                    de forma independente dos serviços prestados.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card md:col-span-2">
                <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                      Receita Mensal (Este Ano)
                    </CardTitle>{' '}
                    <CardDescription className="mt-1 flex items-center gap-2 text-muted-foreground">
                      Média mensal calculada:{' '}
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      >
                        {formatCurrency(averageRevenue)}
                      </Badge>
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="py-6">
                  {monthlyRevenue.length === 0 ? (
                    <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
                      Nenhum registro encontrado para este período.
                    </div>
                  ) : (
                    <ChartContainer
                      config={{
                        total: { label: 'Receita', color: 'hsl(142 71% 45%)' },
                      }}
                      className="h-[180px] w-full"
                    >
                      <BarChart
                        data={monthlyRevenue}
                        margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          fontSize={12}
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          dy={10}
                        />
                        <YAxis
                          tickFormatter={(val) => `R$ ${val}`}
                          axisLine={false}
                          tickLine={false}
                          fontSize={12}
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          width={80}
                        />
                        <ChartTooltip
                          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                          content={
                            <ChartTooltipContent
                              formatter={(val) => formatCurrency(val as number)}
                            />
                          }
                        />
                        <Bar
                          dataKey="total"
                          fill="var(--color-total)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                        <ReferenceLine
                          y={averageRevenue}
                          stroke="hsl(var(--muted-foreground))"
                          strokeDasharray="3 3"
                        />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="border border-border rounded-xl bg-card overflow-hidden shadow-lg p-4 md:p-6">
              <ServicosList />
            </div>
          </TabsContent>
        )}

        <TabsContent value="cronograma" className="space-y-6 outline-none">
          <div className="space-y-6 border border-border rounded-xl bg-card overflow-hidden shadow-lg p-4 md:p-6">
            <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Cronograma de Projetos
              </h3>
              <div className="flex items-center gap-2 hidden md:flex">
                <Button
                  variant="outline"
                  size="icon"
                  className="border-border bg-background hover:bg-muted text-foreground"
                  onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-32 text-center capitalize text-foreground">
                  {format(calendarMonth, 'MMMM yyyy', { locale: ptBR })}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-border bg-background hover:bg-muted text-foreground"
                  onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="text-center py-16 bg-zinc-50 dark:bg-zinc-900/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CalendarIcon className="h-8 w-8 text-zinc-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                  Nenhum projeto ativo no cronograma
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Você não tem projetos associados ou eles não possuem datas definidas.
                </p>
              </div>
            ) : (
              <div className="w-full">
                <div className="hidden md:block rounded-xl border border-border overflow-hidden bg-card/50">
                  <div className="grid grid-cols-7 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                      <div
                        key={d}
                        className="p-3 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800 auto-rows-fr">
                    {calendarDays.map((day, i) => {
                      const key = format(day, 'yyyy-MM-dd')
                      const dayProjects = projectsByDate[key] || []
                      return (
                        <div
                          key={i}
                          className={cn(
                            'min-h-[120px] p-2 bg-white dark:bg-zinc-950 transition-colors flex flex-col gap-1',
                            !isSameMonth(day, calendarMonth) &&
                              'bg-zinc-50/50 dark:bg-zinc-900/50 opacity-60',
                          )}
                        >
                          <div className="flex justify-end mb-1">
                            <span
                              className={cn(
                                'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                                isToday(day)
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'text-muted-foreground',
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
                                          ? 'bg-primary/10 text-primary border-primary/20 font-medium'
                                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                                    )}
                                  >
                                    {p.name}
                                  </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 bg-card border-border">
                                  <div className="space-y-3">
                                    <div>
                                      <h4 className="font-semibold text-sm text-foreground">
                                        {p.name}
                                      </h4>
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

                <div className="flex flex-col md:hidden items-center gap-6 mt-4">
                  <Card className="border-border bg-card p-2 w-full flex justify-center shadow-md">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md bg-background"
                      modifiers={{
                        active: (d: any) => !!projectsByDate[format(d, 'yyyy-MM-dd')],
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
                      <p className="text-sm text-muted-foreground text-center py-4 bg-card/30 rounded-lg border border-border border-dashed">
                        Nenhum projeto ativo nesta data.
                      </p>
                    ) : (
                      selectedDateProjects.map((p) => (
                        <Card key={p.id} className="border-border bg-card/50">
                          <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
                            <div className="font-medium text-sm text-foreground truncate flex-1 pr-2">
                              {p.name}
                            </div>
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
                            <p className="text-xs text-muted-foreground mb-2">
                              Cliente: {p.client || 'N/A'}
                            </p>
                            <div className="flex items-center justify-between text-xs mb-1 text-foreground">
                              <span>Progresso</span>
                              <span className="text-primary">{p.progress || 0}%</span>
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
        </TabsContent>
      </Tabs>

      <EditTaskDialog
        taskId={editingTaskId}
        open={!!editingTaskId}
        onOpenChange={(open) => {
          if (!open) setEditingTaskId(null)
        }}
        onTaskUpdated={() => {
          refetchTasks()
        }}
      />
      <Dialog open={showDailySummary} onOpenChange={setShowDailySummary}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Resumo Diário de Pendências</DialogTitle>
            <DialogDescription>
              Você possui pagamentos que exigem sua atenção hoje.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2 mt-2">
            {urgentPayments.map((p: any) => (
              <button
                key={p.id}
                onClick={() => {
                  setSearchParams({ tab: 'financeiro' })
                  setShowDailySummary(false)
                }}
                className="flex flex-col gap-1 p-3 rounded-lg border border-border bg-card text-left hover:border-primary/50 transition-colors w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <div className="flex justify-between items-start w-full">
                  <span className="font-semibold text-sm text-foreground pr-2">
                    {p.descricao || 'Pagamento não especificado'}
                  </span>
                  {p.isOverdue ? (
                    <Badge
                      variant="destructive"
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground whitespace-nowrap"
                    >
                      Atrasado
                    </Badge>
                  ) : (
                    <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap">
                      Urgente
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground mt-1 w-full">
                  <span className="font-medium text-emerald-500">{formatCurrency(p.valor)}</span>
                  <span>
                    Vencimento:{' '}
                    {format(
                      new Date(new Date(p.data_vencimento).getTime() + 12 * 60 * 60 * 1000),
                      'dd/MM/yyyy',
                    )}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => setShowDailySummary(false)}
              className="w-full sm:w-auto hover:bg-muted text-foreground border-border bg-background border"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
