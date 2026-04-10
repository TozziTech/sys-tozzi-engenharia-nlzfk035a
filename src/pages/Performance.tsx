import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useProjectStore from '@/stores/useProjectStore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { subMonths, isAfter } from 'date-fns'

export default function Performance() {
  const { projects } = useProjectStore()
  const [managerFilter, setManagerFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all') // 'all', 'month', 'semester'

  const managers = useMemo(() => {
    const unique = new Set(projects.map((p) => p.engineer))
    return Array.from(unique)
  }, [projects])

  const filteredProjects = useMemo(() => {
    let filtered = projects
    if (managerFilter !== 'all') {
      filtered = filtered.filter((p) => p.engineer === managerFilter)
    }
    if (periodFilter !== 'all') {
      const today = new Date()
      const cutoff = periodFilter === 'month' ? subMonths(today, 1) : subMonths(today, 6)
      filtered = filtered.filter(
        (p) => isAfter(new Date(p.endDate), cutoff) || isAfter(new Date(p.startDate), cutoff),
      )
    }
    return filtered
  }, [projects, managerFilter, periodFilter])

  const completedVsPendingData = useMemo(() => {
    const dataByManager: Record<string, { name: string; completed: number; pending: number }> = {}

    filteredProjects.forEach((p) => {
      const name = p.engineer.replace('Eng. ', '')
      if (!dataByManager[name]) {
        dataByManager[name] = { name, completed: 0, pending: 0 }
      }
      if (p.status === 'Concluído') {
        dataByManager[name].completed += 1
      } else {
        dataByManager[name].pending += 1
      }
    })

    return Object.values(dataByManager)
  }, [filteredProjects])

  const statusDistributionData = useMemo(() => {
    const counts = { Planejamento: 0, 'Em Andamento': 0, Concluído: 0, Atrasado: 0 }
    filteredProjects.forEach((p) => {
      if (counts[p.status as keyof typeof counts] !== undefined) {
        counts[p.status as keyof typeof counts] += 1
      }
    })
    return [
      { name: 'Concluído', value: counts['Concluído'], fill: 'var(--color-Concluído)' },
      { name: 'Em Andamento', value: counts['Em Andamento'], fill: 'var(--color-EmAndamento)' },
      { name: 'Atrasado', value: counts['Atrasado'], fill: 'var(--color-Atrasado)' },
      { name: 'Planejamento', value: counts['Planejamento'], fill: 'var(--color-Planejamento)' },
    ].filter((d) => d.value > 0)
  }, [filteredProjects])

  const barChartConfig = {
    completed: { label: 'Concluído', color: 'hsl(var(--chart-2))' },
    pending: { label: 'Pendente', color: 'hsl(var(--chart-1))' },
  }

  const pieChartConfig = {
    Concluído: { label: 'Concluído', color: 'hsl(var(--chart-2))' },
    EmAndamento: { label: 'Em Andamento', color: 'hsl(var(--chart-1))' },
    Atrasado: { label: 'Atrasado', color: 'hsl(var(--destructive))' },
    Planejamento: { label: 'Planejamento', color: 'hsl(var(--muted-foreground))' },
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6 space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Performance da Equipe
          </h1>
          <p className="text-muted-foreground">Métricas avançadas e análise de produtividade.</p>
        </div>
      </div>

      <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-dashed">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filtrar por Gerente</label>
              <Select value={managerFilter} onValueChange={setManagerFilter}>
                <SelectTrigger className="w-full bg-white dark:bg-slate-950">
                  <SelectValue placeholder="Todos os gerentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os gerentes</SelectItem>
                  {managers.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-full bg-white dark:bg-slate-950">
                  <SelectValue placeholder="Todo o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo o período</SelectItem>
                  <SelectItem value="month">Último Mês</SelectItem>
                  <SelectItem value="semester">Último Semestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Concluídos vs Pendentes por Gerente</CardTitle>
            <CardDescription>Comparativo de tarefas finalizadas e em aberto</CardDescription>
          </CardHeader>
          <CardContent>
            {completedVsPendingData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                Nenhum dado encontrado para os filtros selecionados.
              </div>
            ) : (
              <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                <BarChart
                  data={completedVsPendingData}
                  margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    fontSize={12}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend verticalAlign="bottom" height={36} />
                  <Bar
                    dataKey="completed"
                    name="Concluído"
                    fill="var(--color-completed)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="pending"
                    name="Pendente"
                    fill="var(--color-pending)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
            <CardDescription>Visão geral do progresso dos projetos</CardDescription>
          </CardHeader>
          <CardContent>
            {statusDistributionData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                Nenhum dado encontrado para os filtros selecionados.
              </div>
            ) : (
              <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
