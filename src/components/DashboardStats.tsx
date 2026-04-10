import { Briefcase, AlertTriangle, Activity, Users, DollarSign, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'

const kpiData = {
  totalProjects: 15,
  inProgress: 8,
  delayed: 2,
  averageProgress: 68,
  allocatedHours: 1200,
  availableHours: 1500,
  estimatedBudget: 500000,
  spentBudget: 350000,
}

const statusData = [
  { name: 'Planejamento', value: 3, fill: '#64748b' },
  { name: 'Em Andamento', value: 8, fill: '#3b82f6' },
  { name: 'Atrasado', value: 2, fill: '#ef4444' },
  { name: 'Concluído', value: 2, fill: '#10b981' },
]

const disciplineData = [
  { name: 'Civil', progress: 80, fill: '#3b82f6' },
  { name: 'Elétrica', progress: 65, fill: '#f59e0b' },
  { name: 'Mecânica', progress: 45, fill: '#6366f1' },
  { name: 'Tubulação', progress: 30, fill: '#8b5cf6' },
]

const temporalData = [
  { month: 'Jan', progress: 10 },
  { month: 'Fev', progress: 25 },
  { month: 'Mar', progress: 45 },
  { month: 'Abr', progress: 60 },
  { month: 'Mai', progress: 75 },
  { month: 'Jun', progress: 85 },
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

const statusConfig = {
  value: { label: 'Projetos', color: '#3b82f6' },
}

const disciplineConfig = {
  progress: { label: 'Progresso (%)', color: '#3b82f6' },
}

const temporalConfig = {
  progress: { label: 'Progresso (%)', color: '#3b82f6' },
}

export function DashboardStats() {
  const stats = [
    {
      title: 'Total de Projetos',
      value: kpiData.totalProjects,
      icon: Briefcase,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      title: 'Projetos em Andamento',
      value: kpiData.inProgress,
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Projetos Atrasados',
      value: kpiData.delayed,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      title: 'Progresso Médio',
      value: `${kpiData.averageProgress}%`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      title: 'Alocação de Horas',
      value: `${kpiData.allocatedHours.toLocaleString()} / ${kpiData.availableHours.toLocaleString()}h`,
      icon: Users,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      title: 'Orçamento (Est. vs Gasto)',
      value: `${formatCurrency(kpiData.estimatedBudget)} / ${formatCurrency(kpiData.spentBudget)}`,
      icon: DollarSign,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
  ]

  return (
    <div className="space-y-8 mb-8">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, i) => (
          <Card
            key={i}
            className="border-none shadow-sm animate-fade-in-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className="col-span-1 shadow-sm border-slate-200 animate-fade-in-up"
          style={{ animationDelay: '300ms' }}
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
          className="col-span-1 shadow-sm border-slate-200 animate-fade-in-up"
          style={{ animationDelay: '400ms' }}
        >
          <CardHeader>
            <CardTitle className="text-lg">Progresso por Disciplina</CardTitle>
            <CardDescription>Média de conclusão em percentual</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={disciplineConfig} className="h-[300px] w-full aspect-auto">
              <BarChart data={disciplineData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                <ChartTooltip
                  cursor={{ fill: 'var(--color-muted)', opacity: 0.2 }}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="progress" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {disciplineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card
          className="col-span-1 md:col-span-2 shadow-sm border-slate-200 animate-fade-in-up"
          style={{ animationDelay: '500ms' }}
        >
          <CardHeader>
            <CardTitle className="text-lg">Evolução Temporal</CardTitle>
            <CardDescription>Progresso acumulado dos projetos ao longo dos meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={temporalConfig} className="h-[300px] w-full aspect-auto">
              <LineChart data={temporalData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Line
                  type="monotone"
                  dataKey="progress"
                  stroke="var(--color-progress)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'var(--color-progress)' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
