import React, { useEffect, useState, useMemo } from 'react'
import { QuoteGeneratorModal } from '@/components/QuoteGeneratorModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Activity,
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  TrendingDown,
  Users,
  Star,
  ChevronLeft,
  ChevronRight,
  Settings2,
  GripVertical,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Link } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { PrintDashboardReport } from '@/components/PrintDashboardReport'
import { PrintExecutiveReport } from '@/components/PrintExecutiveReport'
import { useAuth } from '@/hooks/use-auth'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePreferencesStore } from '@/stores/usePreferencesStore'

const Dashboard = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const { density, dashboardLayout, setDashboardLayout } = usePreferencesStore()

  const [projects, setProjects] = useState<any[]>([])
  const [financials, setFinancials] = useState<any[]>([])
  const [companySettings, setCompanySettings] = useState<any>(null)
  const [printMode, setPrintMode] = useState<'dashboard' | 'executive' | null>(null)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [perfFilter, setPerfFilter] = useState({ period: 'all', status: 'all' })
  const [isEditMode, setIsEditMode] = useState(false)

  const pClass = density === 'compact' ? 'p-3 md:p-4 pt-4' : 'p-4 md:p-8 pt-6'
  const gapClass = density === 'compact' ? 'gap-3' : 'gap-4'
  const spaceYClass = density === 'compact' ? 'space-y-3' : 'space-y-4'

  const loadData = async () => {
    try {
      const [projs, fins, settings, tasksRes, usersRes, accesses] = await Promise.all([
        pb.collection('projects').getFullList(),
        pb.collection('financial_records').getFullList({ sort: 'date' }),
        pb.collection('company_settings').getFullList(),
        pb.collection('tasks').getFullList(),
        pb.collection('users').getFullList(),
        pb.collection('user_project_access').getFullList(),
      ])

      const isAdmin = user?.role === 'Administrador'

      let filteredProjects = projs
      let filteredTasks = tasksRes
      let filteredFinancials = fins

      if (!isAdmin) {
        const authorizedProjectIds = accesses
          .filter((a) => a.user === user?.id)
          .map((a) => a.project)

        filteredProjects = projs.filter((p) => authorizedProjectIds.includes(p.id))
        filteredTasks = tasksRes.filter(
          (t) => authorizedProjectIds.includes(t.project) || !t.project,
        )
        filteredFinancials = fins.filter(
          (f) => authorizedProjectIds.includes(f.project_id) || !f.project_id,
        )
      }

      setProjects(filteredProjects)
      setFinancials(filteredFinancials)
      if (settings.length > 0) setCompanySettings(settings[0])
      setTasks(filteredTasks)
      setUsers(usersRes)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user])

  useRealtime('projects', () => loadData())
  useRealtime('financial_records', () => loadData())
  useRealtime('tasks', () => loadData())
  useRealtime('audit_logs', (e) => {
    if (e.action === 'create' && e.record.action === 'CRITICAL_BOTTLENECK') {
      toast({
        title: 'Gargalo Crítico Detectado',
        description: `Atenção requerida no projeto: ${e.record.resource}`,
        variant: 'destructive',
      })
    }
  })

  // Calculate bottlenecks
  const bottlenecks = useMemo(() => {
    return projects.flatMap((p) => {
      const issues = []
      const spent = p.spent || 0
      const budget = p.budget || 0

      if (budget > 0 && spent > budget) {
        issues.push({
          project: p,
          type: 'budget',
          message: `Orçamento excedido em R$ ${(spent - budget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        })
      }

      if (p.progress < 100 && p.end_date) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const end = new Date(p.end_date)
        end.setHours(0, 0, 0, 0)
        const diffTime = end.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays < 0) {
          issues.push({
            project: p,
            type: 'deadline',
            message: `Prazo ultrapassado (${new Date(p.end_date).toLocaleDateString('pt-BR')})`,
          })
        } else if (diffDays <= 3) {
          issues.push({
            project: p,
            type: 'warning',
            message: `Prazo próximo (${diffDays} dia${diffDays === 1 ? '' : 's'}) - ${new Date(p.end_date).toLocaleDateString('pt-BR')}`,
          })
        }
      }

      return issues
    })
  }, [projects])

  // Calculate financial chart data
  const chartData = useMemo(() => {
    const monthly: Record<string, { month: string; receita: number; despesa: number }> = {}

    financials.forEach((f) => {
      const date = new Date(f.date || f.created)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' })

      if (!monthly[monthKey]) {
        monthly[monthKey] = { month: monthLabel, receita: 0, despesa: 0 }
      }

      const type = f.type?.toLowerCase() || ''
      const isExpense = type.includes('saída') || type.includes('despesa') || f.amount < 0

      if (isExpense) {
        monthly[monthKey].despesa += Math.abs(f.amount)
      } else {
        monthly[monthKey].receita += f.amount
      }
    })

    return Object.keys(monthly)
      .sort()
      .map((k) => monthly[k])
      .slice(-6)
  }, [financials])

  const chartConfig = {
    receita: {
      label: 'Receitas',
      color: 'hsl(var(--primary))',
    },
    despesa: {
      label: 'Despesas',
      color: 'hsl(var(--destructive))',
    },
  }

  const kpiData = useMemo(() => {
    let completedOnTime = 0
    let completedOverdue = 0
    let pendingOnTime = 0
    let pendingOverdue = 0
    let deliveryTimes: number[] = []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    tasks.forEach((t) => {
      const isCompleted = t.status === 'Concluído' || t.status === 'Concluida'
      const hasDueDate = !!t.due_date
      const isOverdue = hasDueDate && new Date(t.due_date) < today

      if (isCompleted) {
        const finishDate = t.completed_at ? new Date(t.completed_at) : new Date(t.updated)
        finishDate.setHours(0, 0, 0, 0)

        if (hasDueDate && finishDate > new Date(t.due_date)) {
          completedOverdue++
        } else {
          completedOnTime++
        }
      } else {
        if (isOverdue) pendingOverdue++
        else pendingOnTime++
      }
    })

    projects
      .filter((p) => p.status === 'Concluído' && p.start_date && p.end_date)
      .forEach((p) => {
        const start = new Date(p.start_date).getTime()
        const end = new Date(p.end_date).getTime()
        if (end > start) {
          deliveryTimes.push((end - start) / (1000 * 60 * 60 * 24))
        }
      })

    const avgDeliveryTime =
      deliveryTimes.length > 0
        ? Math.round(deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length)
        : 0

    return {
      completedOnTime,
      completedOverdue,
      pendingOnTime,
      pendingOverdue,
      avgDeliveryTime,
      totalCompleted: completedOnTime + completedOverdue,
      totalPending: pendingOnTime + pendingOverdue,
    }
  }, [tasks, projects])

  const performanceData = useMemo(() => {
    let filteredTasks = tasks

    if (perfFilter.period === 'month') {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      filteredTasks = filteredTasks.filter((t) => new Date(t.created) >= startOfMonth)
    } else if (perfFilter.period === 'week') {
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      filteredTasks = filteredTasks.filter((t) => new Date(t.created) >= startOfWeek)
    }

    if (perfFilter.status === 'active') {
      const activeProjects = projects.filter((p) => p.status !== 'Concluído').map((p) => p.id)
      filteredTasks = filteredTasks.filter((t) => t.project && activeProjects.includes(t.project))
    } else if (perfFilter.status === 'completed') {
      const completedProjects = projects.filter((p) => p.status === 'Concluído').map((p) => p.id)
      filteredTasks = filteredTasks.filter(
        (t) => t.project && completedProjects.includes(t.project),
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return users
      .map((u) => {
        const userTasks = filteredTasks.filter((t) => t.responsible === u.id)

        let completedOnTime = 0
        let completedOverdue = 0

        const completed = userTasks.filter((t) => {
          const isComp = t.status === 'Concluído' || t.status === 'Concluida'
          if (isComp) {
            const finishDate = t.completed_at ? new Date(t.completed_at) : new Date(t.updated)
            finishDate.setHours(0, 0, 0, 0)
            if (t.due_date && finishDate > new Date(t.due_date)) completedOverdue++
            else completedOnTime++
          }
          return isComp
        })

        const pending = userTasks.filter(
          (t) => t.status !== 'Concluído' && t.status !== 'Concluida',
        )
        const overdue = pending.filter((t) => t.due_date && new Date(t.due_date) < today)

        return {
          user: u.name || u.email,
          total: userTasks.length,
          completed: completed.length,
          completedOnTime,
          completedOverdue,
          pending: pending.length,
          overdue: overdue.length,
          efficiency:
            completed.length > 0 ? Math.round((completedOnTime / completed.length) * 100) : 0,
        }
      })
      .filter((d) => d.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [tasks, users, perfFilter, projects])

  const activeProjectsCount = projects.filter((p) => p.status !== 'Concluído').length
  const completedProjectsCount = projects.filter((p) => p.status === 'Concluído').length

  const isAdmin = user?.role === 'Administrador'

  const handlePrint = (mode: 'dashboard' | 'executive') => {
    setPrintMode(mode)
    setTimeout(() => {
      window.print()
      setPrintMode(null)
    }, 100)
  }

  // Layout Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('widgetId', id)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('widgetId')
    if (sourceId === targetId) return

    const newLayout = [...dashboardLayout]
    const sourceIdx = newLayout.findIndex((w) => w.id === sourceId)
    const targetIdx = newLayout.findIndex((w) => w.id === targetId)

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const [moved] = newLayout.splice(sourceIdx, 1)
      newLayout.splice(targetIdx, 0, moved)

      newLayout.forEach((w, i) => (w.order = i))
      setDashboardLayout(newLayout, user?.id)
    }
  }

  const handleResize = (id: string, delta: number) => {
    const newLayout = dashboardLayout.map((w) => {
      if (w.id === id) {
        const newSpan = Math.max(2, Math.min(7, w.colSpan + delta))
        return { ...w, colSpan: newSpan }
      }
      return w
    })
    setDashboardLayout(newLayout, user?.id)
  }

  const renderWidgetContent = (id: string) => {
    switch (id) {
      case 'metrics':
        return (
          <div className={`grid ${gapClass} md:grid-cols-2 lg:grid-cols-4 h-full`}>
            <Card className="shadow-sm border-muted/60 h-full flex flex-col justify-center">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? '-' : activeProjectsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Em andamento ou planejamento</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-muted/60 h-full flex flex-col justify-center">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alertas de Diagnóstico</CardTitle>
                <div className="p-2 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">
                  {loading ? '-' : bottlenecks.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Atrasos ou orçamento estourado</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-muted/60 h-full flex flex-col justify-center">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projetos Concluídos</CardTitle>
                <div className="p-2 bg-green-500/10 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? '-' : completedProjectsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Entregas finalizadas</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-muted/60 h-full flex flex-col justify-center">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Equipe Ativa</CardTitle>
                <div className="p-2 bg-blue-500/10 rounded-full">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">8</div>
                <p className="text-xs text-muted-foreground mt-1">2 online no momento</p>
              </CardContent>
            </Card>
          </div>
        )
      case 'financial':
        return (
          <Card className="shadow-sm h-full flex flex-col">
            <CardHeader>
              <CardTitle>Métricas Financeiras</CardTitle>
              <CardDescription>Análise mensal de Receitas vs Despesas registradas.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[250px]">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nenhum dado financeiro disponível.
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis
                      tickFormatter={(v) => `R$ ${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="receita"
                      fill="var(--color-receita)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                    <Bar
                      dataKey="despesa"
                      fill="var(--color-despesa)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        )
      case 'bottlenecks':
        return (
          <Card className="shadow-sm border-destructive/30 h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center text-destructive">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Diagnóstico e Alertas
              </CardTitle>
              <CardDescription>Projetos exigindo atenção imediata.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col">
              {loading ? (
                <div className="text-center text-muted-foreground py-8">Analisando projetos...</div>
              ) : bottlenecks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mb-3 text-green-500/50" />
                  <p>Nenhum problema detectado no diagnóstico!</p>
                  <p className="text-sm">Todos os projetos estão dentro do prazo e orçamento.</p>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto pr-2 flex-1 max-h-[300px]">
                  {bottlenecks.map((b, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-1 p-3 rounded-md bg-muted/50 border border-muted"
                    >
                      <Link
                        to={`/projects/${b.project.id}`}
                        className="font-semibold text-sm hover:text-primary transition-colors"
                      >
                        {b.project.name}
                      </Link>
                      <div className="flex items-center text-sm">
                        {b.type === 'budget' ? (
                          <TrendingDown className="w-4 h-4 mr-1.5 text-destructive shrink-0" />
                        ) : b.type === 'deadline' ? (
                          <Clock className="w-4 h-4 mr-1.5 text-destructive shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-500 shrink-0" />
                        )}
                        <span
                          className={
                            b.type === 'budget' || b.type === 'deadline'
                              ? 'text-destructive font-medium'
                              : 'text-amber-600 font-medium'
                          }
                        >
                          {b.message}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      case 'progress':
        return (
          <Card className="shadow-sm h-full flex flex-col">
            <CardHeader>
              <CardTitle>Progresso dos Projetos</CardTitle>
              <CardDescription>Acompanhamento detalhado do desenvolvimento.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-[350px]">
              <div className="space-y-6">
                {projects.slice(0, 5).map((p, i) => (
                  <div
                    key={p.id || i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-muted/40 pb-4 last:border-0 last:pb-0 gap-4 sm:gap-0"
                  >
                    <div className="space-y-1 flex-1 pr-4">
                      <Link
                        to={`/projects/${p.id}`}
                        className="text-sm font-semibold leading-none hover:underline"
                      >
                        {p.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">{p.client || 'Sem cliente'}</p>
                    </div>
                    <div className="flex flex-col sm:items-end w-32 shrink-0">
                      <div className="flex items-center gap-2 w-full">
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${p.progress < 50 ? (p.progress < 35 ? 'bg-destructive' : 'bg-orange-500') : 'bg-primary'}`}
                            style={{ width: `${p.progress || 0}%` }}
                          />
                        </div>
                        <p className="text-sm font-medium w-9 text-right">{p.progress || 0}%</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{p.status}</p>
                    </div>
                  </div>
                ))}
                {!loading && projects.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum projeto encontrado.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      case 'activity':
        return (
          <Card className="shadow-sm h-full flex flex-col">
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>Últimas atualizações da equipe de projetos.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-[350px]">
              <div className="space-y-6">
                {[
                  {
                    user: 'João Silva',
                    action: 'finalizou a tarefa no',
                    target: 'Design System',
                    time: 'Há 2 horas',
                  },
                  {
                    user: 'Maria Santos',
                    action: 'adicionou um comentário em',
                    target: 'App de Entregas',
                    time: 'Há 4 horas',
                  },
                  {
                    user: 'Pedro Costa',
                    action: 'criou o projeto',
                    target: 'Landing Page B2B',
                    time: 'Ontem às 16:30',
                  },
                ].map((a, i) => (
                  <div key={i} className="flex items-start">
                    <div className="bg-muted/50 p-2 rounded-full mr-4 mt-0.5 border border-muted">
                      <Activity className="h-4 w-4 text-foreground/70" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm leading-snug">
                        <span className="font-semibold">{a.user}</span> {a.action}{' '}
                        <span className="font-semibold text-primary">{a.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      default:
        return null
    }
  }

  if (!loading && !isAdmin && projects.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full min-h-[80vh] animate-fade-in-up">
        <div className="bg-zinc-900/80 backdrop-blur-md border border-amber-500/20 p-8 rounded-2xl max-w-md shadow-2xl shadow-black/40">
          <div className="bg-amber-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
            <Briefcase className="h-10 w-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-3">Nenhum projeto associado</h2>
          <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
            Seu painel está vazio pois você ainda não foi alocado em nenhum projeto. Entre em
            contato com o gestor ou administrador para solicitar seu acesso.
          </p>
          <Button
            className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold"
            onClick={() => window.location.reload()}
          >
            Atualizar Painel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex-1 flex flex-col h-full ${pClass} ${spaceYClass}`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Geral</h2>
          <p className="text-muted-foreground mt-1">
            Visão geral financeira, status dos projetos e alertas importantes.
          </p>
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <QuoteGeneratorModal>
            <Button className="w-full md:w-auto shadow-sm">
              <FileText className="mr-2 h-4 w-4" />
              Gerar Orçamento
            </Button>
          </QuoteGeneratorModal>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto shadow-sm">
                <Printer className="mr-2 h-4 w-4" />
                Exportar Relatórios
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handlePrint('dashboard')}>
                Dashboard Atual (Resumo)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrint('executive')}>
                Relatório Executivo (Projetos)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <PrintDashboardReport
        projects={projects}
        financials={financials}
        bottlenecks={bottlenecks}
        companySettings={companySettings}
        userName={user?.name || user?.email || 'Administrador'}
        printMode={printMode}
      />
      <PrintExecutiveReport
        projects={projects}
        companySettings={companySettings}
        userName={user?.name || user?.email || 'Administrador'}
        printMode={printMode}
      />

      {projects.filter((p) => p.is_priority && p.status !== 'Concluído').length > 0 && (
        <div className={`mt-2 mb-4 animate-fade-in-down`}>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <h3 className="text-xl font-bold">Projetos Prioritários</h3>
          </div>
          <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3`}>
            {projects
              .filter((p) => p.is_priority && p.status !== 'Concluído')
              .map((p) => (
                <Card
                  key={p.id}
                  className="border-yellow-200 dark:border-yellow-900/50 bg-yellow-50/30 dark:bg-yellow-900/10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
                  <CardHeader className="pb-2 pl-5">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base line-clamp-1">
                        <Link to={`/projects/${p.id}`} className="hover:underline">
                          {p.name}
                        </Link>
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
                      >
                        Prioridade
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-1">{p.client}</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-5">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{p.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500"
                        style={{ width: `${p.progress || 0}%` }}
                      />
                    </div>
                    {p.end_date && (
                      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Entrega: {new Date(p.end_date).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full mt-2">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="kpis">KPIs & Produtividade</TabsTrigger>
            <TabsTrigger value="performance">Performance de Equipe</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" asChild>
            <Button
              variant={isEditMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className="ml-auto hidden md:flex h-8 shadow-sm transition-all"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              {isEditMode ? 'Concluir Edição' : 'Personalizar Layout'}
            </Button>
          </TabsContent>
        </div>

        <TabsContent value="overview" className={spaceYClass}>
          <div className="flex justify-end md:hidden mb-2">
            <Button
              variant={isEditMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className="shadow-sm w-full transition-all"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              {isEditMode ? 'Concluir Edição' : 'Personalizar Layout'}
            </Button>
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-7 ${gapClass}`}>
            {dashboardLayout
              .sort((a, b) => a.order - b.order)
              .map((widget) => {
                const colSpanMap: Record<number, string> = {
                  1: 'lg:col-span-1',
                  2: 'lg:col-span-2',
                  3: 'lg:col-span-3',
                  4: 'lg:col-span-4',
                  5: 'lg:col-span-5',
                  6: 'lg:col-span-6',
                  7: 'lg:col-span-7',
                }
                return (
                  <div
                    key={widget.id}
                    draggable={isEditMode}
                    onDragStart={(e) => handleDragStart(e, widget.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, widget.id)}
                    className={`relative transition-all duration-200 ${colSpanMap[widget.colSpan] || 'lg:col-span-3'} ${
                      isEditMode
                        ? 'ring-2 ring-primary border-dashed border-2 p-1.5 rounded-xl cursor-move bg-muted/10'
                        : ''
                    }`}
                  >
                    {isEditMode && (
                      <div className="absolute -top-3 -right-3 z-20 flex items-center gap-1 bg-background shadow-md border rounded-lg p-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move mr-1" />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleResize(widget.id, -1)}
                          disabled={widget.colSpan <= 2}
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <span className="text-xs font-mono w-4 text-center">{widget.colSpan}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleResize(widget.id, 1)}
                          disabled={widget.colSpan >= 7}
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {renderWidgetContent(widget.id)}
                  </div>
                )
              })}
          </div>
        </TabsContent>

        <TabsContent value="kpis" className={spaceYClass}>
          <div className={`grid ${gapClass} md:grid-cols-2 lg:grid-cols-4`}>
            <Card className="shadow-sm border-muted/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concluídas no Prazo</CardTitle>
                <div className="p-2 bg-green-500/10 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? '-' : kpiData.completedOnTime}</div>
                <p className="text-xs text-muted-foreground mt-1">Tarefas entregues em dia</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-muted/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concluídas c/ Atraso</CardTitle>
                <div className="p-2 bg-amber-500/10 rounded-full">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? '-' : kpiData.completedOverdue}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tarefas entregues fora do prazo
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-muted/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tarefas Atrasadas</CardTitle>
                <div className="p-2 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">
                  {loading ? '-' : kpiData.pendingOverdue}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Pendentes e fora do prazo</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-muted/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">TMA de Projetos</CardTitle>
                <div className="p-2 bg-blue-500/10 rounded-full">
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? '-' : kpiData.avgDeliveryTime}d</div>
                <p className="text-xs text-muted-foreground mt-1">Tempo Médio de Atendimento</p>
              </CardContent>
            </Card>
          </div>

          <div className={`grid ${gapClass} md:grid-cols-2`}>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Qualidade das Entregas (Tarefas Concluídas)</CardTitle>
                <CardDescription>
                  Distribuição de tarefas concluídas no prazo vs com atraso.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-6">
                {kpiData.totalCompleted === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Sem dados de tarefas concluídas
                  </div>
                ) : (
                  <ChartContainer
                    config={{
                      onTime: { label: 'No Prazo', color: '#10b981' },
                      overdue: { label: 'Com Atraso', color: '#f59e0b' },
                    }}
                    className="h-[250px] w-full max-w-[300px]"
                  >
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={[
                          {
                            name: 'No Prazo',
                            value: kpiData.completedOnTime,
                            fill: 'var(--color-onTime)',
                          },
                          {
                            name: 'Com Atraso',
                            value: kpiData.completedOverdue,
                            fill: 'var(--color-overdue)',
                          },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        strokeWidth={5}
                        paddingAngle={5}
                      >
                        <Cell key="cell-0" fill="var(--color-onTime)" />
                        <Cell key="cell-1" fill="var(--color-overdue)" />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Status Atual das Tarefas Pendentes</CardTitle>
                <CardDescription>Visão geral de tarefas em andamento e atrasadas.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-6">
                {kpiData.totalPending === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Sem tarefas pendentes
                  </div>
                ) : (
                  <ChartContainer
                    config={{
                      pending: { label: 'No Prazo (Pendentes)', color: '#3b82f6' },
                      overdue: { label: 'Atrasadas', color: '#ef4444' },
                    }}
                    className="h-[250px] w-full max-w-[300px]"
                  >
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={[
                          {
                            name: 'No Prazo',
                            value: kpiData.pendingOnTime,
                            fill: 'var(--color-pending)',
                          },
                          {
                            name: 'Atrasadas',
                            value: kpiData.pendingOverdue,
                            fill: 'var(--color-overdue)',
                          },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        strokeWidth={5}
                        paddingAngle={5}
                      >
                        <Cell key="cell-0" fill="var(--color-pending)" />
                        <Cell key="cell-1" fill="var(--color-overdue)" />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className={spaceYClass}>
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/30 p-4 rounded-lg border">
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <span className="text-sm font-medium">Filtro de Produtividade</span>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={perfFilter.period}
                  onValueChange={(v) => setPerfFilter((prev) => ({ ...prev, period: v }))}
                >
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo o período</SelectItem>
                    <SelectItem value="month">Este mês</SelectItem>
                    <SelectItem value="week">Esta semana</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={perfFilter.status}
                  onValueChange={(v) => setPerfFilter((prev) => ({ ...prev, status: v }))}
                >
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Status do Projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Projetos</SelectItem>
                    <SelectItem value="active">Projetos Ativos</SelectItem>
                    <SelectItem value="completed">Projetos Concluídos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className={`grid ${gapClass} md:grid-cols-2`}>
            <Card className="col-span-1 shadow-sm">
              <CardHeader>
                <CardTitle>Distribuição de Tarefas por Membro</CardTitle>
                <CardDescription>Volume total de tarefas alocadas e status.</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Nenhum dado encontrado.
                  </div>
                ) : (
                  <ChartContainer
                    config={{
                      completed: { label: 'Concluídas', color: '#10b981' },
                      pending: { label: 'Pendentes', color: '#f59e0b' },
                      overdue: { label: 'Atrasadas', color: '#ef4444' },
                    }}
                    className="h-[300px] w-full"
                  >
                    <BarChart
                      data={performanceData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="user" tickLine={false} axisLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="completed"
                        fill="var(--color-completed)"
                        stackId="a"
                        radius={[0, 0, 4, 4]}
                        maxBarSize={40}
                      />
                      <Bar
                        dataKey="pending"
                        fill="var(--color-pending)"
                        stackId="a"
                        maxBarSize={40}
                      />
                      <Bar
                        dataKey="overdue"
                        fill="var(--color-overdue)"
                        stackId="a"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1 shadow-sm">
              <CardHeader>
                <CardTitle>Status de Conclusão</CardTitle>
                <CardDescription>Detalhamento de produtividade por membro.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Membro</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Concluídas</TableHead>
                        <TableHead className="text-center">Eficiência</TableHead>
                        <TableHead className="text-center">Pendentes</TableHead>
                        <TableHead className="text-center">Atrasadas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {performanceData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                            Nenhum dado encontrado para os filtros selecionados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        performanceData.map((d, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{d.user}</TableCell>
                            <TableCell className="text-center">{d.total}</TableCell>
                            <TableCell className="text-center text-green-600 font-medium">
                              {d.completed}{' '}
                              <span className="text-xs text-muted-foreground">
                                ({d.completedOnTime} no prazo)
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={
                                  d.efficiency >= 80
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : d.efficiency >= 50
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-red-50 text-red-700 border-red-200'
                                }
                              >
                                {d.efficiency}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-amber-600 font-medium">
                              {d.pending}
                            </TableCell>
                            <TableCell className="text-center text-red-600 font-medium">
                              {d.overdue}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Dashboard
