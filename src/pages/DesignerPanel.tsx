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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

type DatePreset =
  | 'Este Mês'
  | 'Últimos 3 Meses'
  | 'Últimos 6 Meses'
  | 'Este Ano'
  | 'Todos os Tempos'
  | 'Customizado'

const EMPTY_ARRAY: any[] = []

const getPresetRange = (preset: DatePreset) => {
  const now = new Date()
  switch (preset) {
    case 'Este Mês':
      return { from: startOfMonth(now), to: endOfMonth(now) }
    case 'Últimos 3 Meses':
      return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) }
    case 'Últimos 6 Meses':
      return { from: startOfMonth(subMonths(now, 5)), to: endOfMonth(now) }
    case 'Este Ano':
      return { from: startOfYear(now), to: endOfYear(now) }
    case 'Todos os Tempos':
      return { from: new Date(2000, 0, 1), to: new Date(2100, 0, 1) }
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) }
  }
}

export default function DesignerPanel() {
  const { user } = useAuth()
  const { canAccess } = usePermissions()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'gerenciamento'

  const [datePreset, setDatePreset] = useState<DatePreset>('Todos os Tempos')
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() =>
    getPresetRange('Todos os Tempos'),
  )

  const [calendarMonth, setCalendarMonth] = useState(dateRange.from)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const [exportingDocs, setExportingDocs] = useState(false)
  const hasShownDailySummary = useRef(false)
  const [showDailySummary, setShowDailySummary] = useState(false)

  const hasFinanceAccess = canAccess('planilha_financeira') || user?.role === 'Administrador'

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

  const filterFrom = format(dateRange.from, "yyyy-MM-dd 00:00:00.000'Z'")
  const filterTo = format(dateRange.to, "yyyy-MM-dd 23:59:59.999'Z'")

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
    `designer_urgent_tasks_${user?.id}_${filterFrom}_${filterTo}`,
    () =>
      pb.collection('tasks').getFullList({
        filter: `responsible = "${user?.id}" && status != "Concluído" && due_date >= "${filterFrom}" && due_date <= "${filterTo}"`,
        expand: 'project',
        sort: 'due_date',
      }),
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

  useEffect(() => {
    setCalendarMonth(dateRange.from)
  }, [dateRange.from.getTime()])

  useRealtime('projects', refetchProjects, !!user?.id)
  useRealtime('user_project_access', refetchProjects, !!user?.id)
  useRealtime('tasks', refetchTasks, !!user?.id)

  const periodProjects = useMemo(() => {
    return myProjects.filter((p) => {
      const pStart = p.start_date ? new Date(p.start_date) : new Date(0)
      const pEnd = p.end_date ? new Date(p.end_date) : new Date(8640000000000000)
      return isBefore(pStart, dateRange.to) && isAfter(pEnd, dateRange.from)
    })
  }, [myProjects, dateRange])

  const chartData = useMemo(() => {
    const counts = { Pendente: 0, 'Em Andamento': 0, Concluído: 0 }
    periodProjects.forEach((p) => {
      if (p.status === 'Concluído') counts['Concluído']++
      else if (p.status === 'Em Andamento' || p.status === 'Em Execução') counts['Em Andamento']++
      else counts['Pendente']++
    })

    const total = periodProjects.length || 1

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
  }, [periodProjects])

  const monthlyRevenue = useMemo(() => {
    const monthsMap = new Map()
    const interval = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to })
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
      if (d >= dateRange.from && d <= dateRange.to) {
        const key = format(d, 'yyyy-MM')
        if (monthsMap.has(key)) {
          monthsMap.get(key).total += p.valor
        }
      }
    })

    return Array.from(monthsMap.values())
  }, [revenueData, dateRange])

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
        <div className="flex flex-col items-end gap-2">
          {/* Global Filter */}
          <div className="flex items-center gap-2 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800 w-full md:w-auto">
            <Select
              value={datePreset}
              onValueChange={(val: DatePreset) => {
                setDatePreset(val)
                if (val !== 'Customizado') setDateRange(getPresetRange(val))
              }}
            >
              <SelectTrigger className="w-[160px] bg-zinc-950 border-zinc-800">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Este Mês">Este Mês</SelectItem>
                <SelectItem value="Últimos 3 Meses">Últimos 3 Meses</SelectItem>
                <SelectItem value="Últimos 6 Meses">Últimos 6 Meses</SelectItem>
                <SelectItem value="Este Ano">Este Ano</SelectItem>
                <SelectItem value="Todos os Tempos">Todos os Tempos</SelectItem>
                <SelectItem value="Customizado">Customizado</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="border-zinc-800 bg-zinc-950 text-zinc-100 flex gap-2"
                >
                  <CalendarIcon className="h-4 w-4 text-zinc-400" />
                  {format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range: any) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to })
                      setDatePreset('Customizado')
                    }
                  }}
                  initialFocus
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            variant="outline"
            className="border-zinc-800 bg-zinc-950 text-zinc-100 hidden md:flex shadow-sm"
            onClick={() => {
              queryClient().invalidateQueries('')
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2 text-zinc-400" />
            Atualizar
          </Button>

          <Button
            variant="default"
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-md w-full md:w-auto"
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
          <TabsList className="inline-flex min-w-max h-11 items-center justify-start rounded-md bg-zinc-100 dark:bg-zinc-900 p-1 text-zinc-500 dark:text-zinc-400">
            <TabsTrigger
              value="gerenciamento"
              className="rounded-sm px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-sm"
            >
              Gerenciamento
            </TabsTrigger>
            {hasFinanceAccess && (
              <TabsTrigger
                value="financeiro"
                className="rounded-sm px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-sm"
              >
                Meus Serviços Financeiros
              </TabsTrigger>
            )}
            <TabsTrigger
              value="cronograma"
              className="rounded-sm px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-sm"
            >
              Cronograma de Projetos
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="gerenciamento" className="space-y-6 outline-none">
          {hasFinanceAccess && (overdueCount > 0 || dueSoonCount > 0) && (
            <div className="grid gap-3 md:grid-cols-2 mb-2">
              {overdueCount > 0 && (
                <Alert
                  variant="destructive"
                  className="bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900"
                >
                  <AlertCircle className="h-5 w-5 !text-rose-600 dark:!text-rose-400" />
                  <AlertTitle className="font-semibold text-rose-800 dark:text-rose-300">
                    Pagamentos Atrasados
                  </AlertTitle>
                  <AlertDescription className="text-rose-700 dark:text-rose-400 mt-1">
                    Você tem {overdueCount} parcela{overdueCount > 1 ? 's' : ''} de serviço
                    financeiro em atraso.
                  </AlertDescription>
                </Alert>
              )}
              {dueSoonCount > 0 && (
                <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                  <AlertTriangle className="h-5 w-5 !text-amber-600 dark:!text-amber-400" />
                  <AlertTitle className="font-semibold text-amber-800 dark:text-amber-300">
                    Pagamentos Vencendo
                  </AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-400 mt-1">
                    Você tem {dueSoonCount} parcela{dueSoonCount > 1 ? 's' : ''} de serviço
                    financeiro vencendo nos próximos 3 dias.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-100">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              Atividades do Período
            </h3>
            {urgentTasks.length === 0 ? (
              <div className="text-center py-8 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-3 opacity-50" />
                <p className="text-sm text-zinc-400">
                  Nenhum registro encontrado para este período.
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

          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-100">
              <LayoutDashboard className="h-5 w-5 text-amber-500" />
              Métricas de Eficiência
            </h3>
            <Card className="border-zinc-800/50 bg-zinc-950/50">
              <CardHeader className="pb-3 border-b border-zinc-800/50">
                <CardTitle className="text-lg">Período Selecionado</CardTitle>
                <CardDescription>
                  Distribuição de status (%) dos {periodProjects.length} projetos com atividades
                  neste período
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

          <MyTasksList dateRange={dateRange} />
        </TabsContent>

        {hasFinanceAccess && (
          <TabsContent value="financeiro" className="space-y-6 outline-none">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/50 md:col-span-1 h-fit">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-800 dark:text-blue-300">
                    <Info className="h-4 w-4" />
                    Guia Rápido de Lançamentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-blue-700 dark:text-blue-400 space-y-3">
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

              <Card className="border-zinc-800/50 bg-zinc-950/50 md:col-span-2">
                <CardHeader className="pb-3 border-b border-zinc-800/50 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                      Receita Mensal (Período Selecionado)
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-2">
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
                    <div className="h-[180px] flex items-center justify-center text-sm text-zinc-500">
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

            <div className="border border-zinc-800 rounded-xl bg-zinc-950/30 overflow-hidden shadow-lg p-4 md:p-6">
              <ServicosList />
            </div>
          </TabsContent>
        )}

        <TabsContent value="cronograma" className="space-y-6 outline-none">
          <div className="space-y-6 border border-zinc-800 rounded-xl bg-zinc-950/30 overflow-hidden shadow-lg p-4 md:p-6">
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

                <div className="flex flex-col md:hidden items-center gap-6 mt-4">
                  <Card className="border-zinc-800 bg-zinc-950 p-2 w-full flex justify-center shadow-md">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md"
                      modifiers={{
                        active: (d: any) => !!projectsByDate[format(d, 'yyyy-MM-dd')],
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
        </TabsContent>
      </Tabs>

      <Dialog open={showDailySummary} onOpenChange={setShowDailySummary}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Resumo Diário de Pendências</DialogTitle>
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
                className="flex flex-col gap-1 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 text-left hover:border-amber-500/50 transition-colors w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <div className="flex justify-between items-start w-full">
                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 pr-2">
                    {p.descricao || 'Pagamento não especificado'}
                  </span>
                  {p.isOverdue ? (
                    <Badge
                      variant="destructive"
                      className="bg-rose-500 hover:bg-rose-600 text-white whitespace-nowrap"
                    >
                      Atrasado
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-amber-950 whitespace-nowrap">
                      Urgente
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between items-center text-sm text-zinc-500 mt-1 w-full">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(p.valor)}
                  </span>
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
            <Button onClick={() => setShowDailySummary(false)} className="w-full sm:w-auto">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
