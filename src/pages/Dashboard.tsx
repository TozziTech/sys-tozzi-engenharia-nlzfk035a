import { useMemo, useState, useEffect } from 'react'
import { Briefcase, AlertTriangle, Activity, CheckCircle2, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bar, BarChart, Pie, PieChart, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useProjectStore from '@/stores/useProjectStore'

const statusColors: Record<string, string> = {
  Planejamento: '#64748b',
  'Em Andamento': '#3b82f6',
  Atrasado: '#ef4444',
  Concluído: '#10b981',
}

export default function Dashboard() {
  const { projects, timeLogs } = useProjectStore()

  const [periodFilter, setPeriodFilter] = useState('all')
  const [dbTotalSpent, setDbTotalSpent] = useState<number | null>(null)

  useEffect(() => {
    const fetchTotalSpent = async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        const { data, error } = await supabase
          .from('time_entries')
          .select('hours')
          .eq('status', 'Approved')

        if (!error && data) {
          const HOURLY_RATE = 150
          const total = data.reduce((acc, row) => acc + row.hours * HOURLY_RATE, 0)
          setDbTotalSpent(total)
        } else {
          throw new Error('Fallback')
        }
      } catch (err) {
        const HOURLY_RATE = 150
        const total = (timeLogs || [])
          .filter((l: any) => l.status === 'Approved')
          .reduce((acc: number, row: any) => acc + row.hours * HOURLY_RATE, 0)
        setDbTotalSpent(total)
      }
    }
    fetchTotalSpent()
  }, [timeLogs])

  const [managerFilter, setManagerFilter] = useState('all')

  const managers = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.engineer))).filter(Boolean)
  }, [projects])

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesManager = managerFilter === 'all' || p.engineer === managerFilter
      let matchesPeriod = true

      if (periodFilter === 'current_month') {
        const date = new Date(p.startDate)
        const now = new Date()
        matchesPeriod =
          date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      } else if (periodFilter === 'last_6_months') {
        const date = new Date(p.startDate)
        const now = new Date()
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(now.getMonth() - 6)
        matchesPeriod = date >= sixMonthsAgo && date <= now
      }

      return matchesManager && matchesPeriod
    })
  }, [projects, managerFilter, periodFilter])

  const stats = useMemo(() => {
    const total = filteredProjects.length
    const completed = filteredProjects.filter((p) => p.status === 'Concluído').length
    const inProgress = filteredProjects.filter((p) => p.status === 'Em Andamento').length
    const overdue = filteredProjects.filter(
      (p) =>
        p.status === 'Atrasado' || (new Date(p.endDate) < new Date() && p.status !== 'Concluído'),
    ).length

    const totalSpent =
      dbTotalSpent !== null
        ? dbTotalSpent
        : filteredProjects.reduce((acc, p) => acc + (p.spent || 0), 0)

    return { total, completed, inProgress, overdue, totalSpent }
  }, [filteredProjects, dbTotalSpent])

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredProjects.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: statusColors[name] || '#cbd5e1',
    }))
  }, [filteredProjects])

  const workloadData = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredProjects.forEach((p) => {
      counts[p.engineer] = (counts[p.engineer] || 0) + 1
    })
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      fill: '#6366f1',
    }))
  }, [filteredProjects])

  const statusConfig = {
    value: { label: 'Projetos', color: '#3b82f6' },
  }
  const workloadConfig = {
    count: { label: 'Projetos Atribuídos', color: '#6366f1' },
  }

  const performanceData = useMemo(() => {
    const managersStats: Record<
      string,
      { active: number; completed: number; tasksCompleted: number; tasksPending: number }
    > = {}

    filteredProjects.forEach((p) => {
      const eng = p.engineer || 'Não Atribuído'
      if (!managersStats[eng]) {
        managersStats[eng] = { active: 0, completed: 0, tasksCompleted: 0, tasksPending: 0 }
      }

      if (p.status === 'Concluído') {
        managersStats[eng].completed += 1
      } else {
        managersStats[eng].active += 1
      }

      const totalTasks = 10
      const completed = Math.round((p.progress / 100) * totalTasks)
      const pending = totalTasks - completed

      managersStats[eng].tasksCompleted += completed
      managersStats[eng].tasksPending += pending
    })

    return Object.entries(managersStats).map(([name, stats]) => ({
      name: name.replace('Eng. ', ''),
      ...stats,
    }))
  }, [filteredProjects])

  const performanceConfig = {
    tasksCompleted: { label: 'Tarefas Concluídas', color: '#10b981' },
    tasksPending: { label: 'Tarefas Pendentes', color: '#f59e0b' },
    active: { label: 'Projetos Ativos', color: '#3b82f6' },
    completed: { label: 'Projetos Concluídos', color: '#10b981' },
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            Dashboard de Projetos
          </h1>
          <p className="text-muted-foreground">
            Monitoramento global de desempenho e alocação da equipe.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-xl border shadow-sm">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o período</SelectItem>
              <SelectItem value="current_month">Mês atual</SelectItem>
              <SelectItem value="last_6_months">Últimos 6 meses</SelectItem>
            </SelectContent>
          </Select>

          <Select value={managerFilter} onValueChange={setManagerFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Gerente/Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Gerentes</SelectItem>
              {managers.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm flex items-center gap-2 mb-6">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          Os dados exibidos são temporários e mockados. Conecte um backend (Skip Cloud ou Supabase)
          para persistência permanente.
        </span>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <img
            src="https://img.usecurling.com/p/300/300?q=dashboard%20empty&color=gray"
            alt="No projects"
            className="w-64 h-64 object-cover rounded-full mb-6 opacity-80"
          />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Nenhum projeto encontrado</h3>
          <p className="text-muted-foreground max-w-md">
            Ajuste os filtros ou adicione novos projetos para visualizar as métricas.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card
              className="border-none shadow-sm animate-fade-in-up"
              style={{ animationDelay: `0ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Projetos
                </CardTitle>
                <div className="p-2 rounded-lg bg-indigo-100">
                  <Briefcase className="h-4 w-4 text-indigo-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              </CardContent>
            </Card>

            <Card
              className="border-none shadow-sm animate-fade-in-up"
              style={{ animationDelay: `100ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Projetos Concluídos
                </CardTitle>
                <div className="p-2 rounded-lg bg-emerald-100">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stats.completed}</div>
              </CardContent>
            </Card>

            <Card
              className="border-none shadow-sm animate-fade-in-up"
              style={{ animationDelay: `200ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Em Andamento
                </CardTitle>
                <div className="p-2 rounded-lg bg-blue-100">
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stats.inProgress}</div>
              </CardContent>
            </Card>

            <Card
              className="border-none shadow-sm animate-fade-in-up"
              style={{ animationDelay: `300ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Projetos Atrasados
                </CardTitle>
                <div className="p-2 rounded-lg bg-red-100">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stats.overdue}</div>
              </CardContent>
            </Card>
            <Card
              className="border-none shadow-sm animate-fade-in-up"
              style={{ animationDelay: `400ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Custo Real Total
                </CardTitle>
                <div className="p-2 rounded-lg bg-emerald-100">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    stats.totalSpent,
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card
              className="col-span-1 shadow-sm border-slate-200 animate-fade-in-up"
              style={{ animationDelay: '400ms' }}
            >
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Status</CardTitle>
                <CardDescription>Quantidade de projetos por fase atual</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={statusConfig} className="h-[300px] w-full aspect-auto">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={65}
                      outerRadius={100}
                      strokeWidth={2}
                      paddingAngle={2}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card
              className="col-span-1 lg:col-span-2 shadow-sm border-slate-200 animate-fade-in-up"
              style={{ animationDelay: '500ms' }}
            >
              <CardHeader>
                <CardTitle className="text-lg">Performance e Produtividade</CardTitle>
                <CardDescription>
                  Tarefas Concluídas vs. Pendentes por Membro da Equipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={performanceConfig} className="h-[300px] w-full aspect-auto">
                  <BarChart
                    data={performanceData}
                    margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                    <ChartTooltip
                      cursor={{ fill: 'var(--color-muted)', opacity: 0.2 }}
                      content={<ChartTooltipContent />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="tasksCompleted"
                      stackId="a"
                      fill="var(--color-tasksCompleted)"
                      maxBarSize={50}
                    />
                    <Bar
                      dataKey="tasksPending"
                      stackId="a"
                      fill="var(--color-tasksPending)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card
              className="col-span-1 lg:col-span-3 shadow-sm border-slate-200 animate-fade-in-up"
              style={{ animationDelay: '600ms' }}
            >
              <CardHeader>
                <CardTitle className="text-lg">
                  Status de Alocação (Projetos Ativos x Concluídos)
                </CardTitle>
                <CardDescription>Comparativo de capacidade por gerente/responsável</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={performanceConfig} className="h-[300px] w-full aspect-auto">
                  <BarChart
                    data={performanceData}
                    margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                    <ChartTooltip
                      cursor={{ fill: 'var(--color-muted)', opacity: 0.2 }}
                      content={<ChartTooltipContent />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="active"
                      fill="var(--color-active)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                    <Bar
                      dataKey="completed"
                      fill="var(--color-completed)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
