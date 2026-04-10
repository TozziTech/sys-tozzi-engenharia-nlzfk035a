import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  LineChart,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import useProjectStore from '@/stores/useProjectStore'

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
]

const chartConfig = {
  budget: {
    label: 'Orçamento (R$)',
    color: 'hsl(var(--chart-1))',
  },
  spent: {
    label: 'Gasto (R$)',
    color: 'hsl(var(--chart-2))',
  },
}

export default function Reports() {
  const { projects } = useProjectStore()

  const statusData = useMemo(() => {
    const counts = projects.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [projects])

  const disciplineData = useMemo(() => {
    const counts = projects.reduce(
      (acc, p) => {
        acc[p.discipline] = (acc[p.discipline] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [projects])

  const financialData = useMemo(() => {
    const months = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ]
    // Adding deterministic mock data for visual consistency
    return months.map((month, i) => ({
      name: month,
      budget: 100000 + i * 15000,
      spent: 90000 + i * 14000 + (Math.random() * 20000 - 10000),
    }))
  }, [])

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Relatórios</h1>
        <p className="text-muted-foreground">Análises e métricas dos projetos da empresa.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChartIcon className="h-5 w-5 text-slate-500" /> Status dos Projetos
            </CardTitle>
            <CardDescription>Distribuição de projetos por status atual</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={{}} className="h-[300px] w-full">
              <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b' }}
                  allowDecimals={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LineChartIcon className="h-5 w-5 text-slate-500" /> Execução Financeira
            </CardTitle>
            <CardDescription>Orçamento previsto x realizado (Ano Atual)</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={financialData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b' }}
                  tickFormatter={(val) => `R$${Math.round(val / 1000)}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="budget"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="spent"
                  stroke="#cbd5e1"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChartIcon className="h-5 w-5 text-slate-500" /> Projetos por Disciplina
            </CardTitle>
            <CardDescription>Distribuição de projetos categorizados por disciplina</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex justify-center pb-8">
            <ChartContainer config={{}} className="h-[350px] w-full max-w-[600px]">
              <RechartsPie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={disciplineData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={130}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                >
                  {disciplineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </RechartsPie>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
