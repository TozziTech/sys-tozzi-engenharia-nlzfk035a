import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import {
  Clock,
  Building2,
  FileText,
  Droplets,
  Zap,
  Paintbrush,
  DollarSign,
  Target,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const projectData = {
  name: 'Residência Exemplo',
  progress: 65,
  nextMilestone: {
    name: 'Conclusão da Estrutura',
    date: '15/11/2026',
  },
  financial: {
    status: 'Em dia',
    health: 'Saudável',
    value: 'R$ 150.000,00',
  },
  timeline: [
    { id: 1, name: 'Projeto', status: 'completed', icon: FileText },
    { id: 2, name: 'Estrutura', status: 'in-progress', icon: Building2 },
    { id: 3, name: 'Hidrossanitário', status: 'pending', icon: Droplets },
    { id: 4, name: 'Elétrico', status: 'pending', icon: Zap },
    { id: 5, name: 'Acabamento', status: 'pending', icon: Paintbrush },
  ],
  evolution: [
    { month: 'Jan', progress: 0 },
    { month: 'Fev', progress: 15 },
    { month: 'Mar', progress: 30 },
    { month: 'Abr', progress: 45 },
    { month: 'Mai', progress: 65 },
  ],
}

const chartConfig = {
  progress: {
    label: 'Progresso (%)',
    color: 'hsl(var(--primary))',
  },
}

export default function ClientDashboard() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Painel do Cliente</h1>
        <p className="text-muted-foreground mt-2">
          Visão geral do projeto:{' '}
          <span className="font-semibold text-foreground">{projectData.name}</span>
        </p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectData.progress}%</div>
            <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-out"
                style={{ width: `${projectData.progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3">Progresso total da obra</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Próximo Marco</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate" title={projectData.nextMilestone.name}>
              {projectData.nextMilestone.name}
            </div>
            <div className="flex items-center text-sm text-muted-foreground mt-3 gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-medium">Estimativa: {projectData.nextMilestone.date}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Situação Financeira</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
              {projectData.financial.status}
            </div>
            <div className="flex flex-col gap-1 mt-3 text-sm text-muted-foreground">
              <span>
                Saúde:{' '}
                <strong className="text-foreground font-medium">
                  {projectData.financial.health}
                </strong>
              </span>
              <span>
                Orçamento:{' '}
                <strong className="text-foreground font-medium">
                  {projectData.financial.value}
                </strong>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Linha do Tempo do Projeto</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="w-full overflow-x-auto pb-6 scrollbar-hide">
            <div className="relative flex justify-between w-full min-w-[700px] px-8">
              {/* Connecting lines */}
              <div className="absolute top-6 left-8 right-8 h-1 bg-secondary -z-10 rounded-full" />
              <div
                className="absolute top-6 left-8 h-1 bg-primary -z-10 rounded-full transition-all duration-1000 ease-in-out"
                style={{ width: '25%' }}
              />

              {projectData.timeline.map((phase) => {
                const Icon = phase.icon
                const isCompleted = phase.status === 'completed'
                const isInProgress = phase.status === 'in-progress'

                return (
                  <div key={phase.id} className="flex flex-col items-center gap-3 relative group">
                    <div className="bg-card px-2">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center border-4 z-10 transition-all duration-300',
                          isCompleted
                            ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                            : isInProgress
                              ? 'bg-blue-500 border-blue-200 text-white dark:border-blue-900 shadow-md scale-110'
                              : 'bg-secondary border-muted text-muted-foreground',
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-center w-28">
                      <p
                        className={cn(
                          'text-sm font-semibold transition-colors duration-300 line-clamp-1',
                          isCompleted || isInProgress ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {phase.name}
                      </p>
                      <p
                        className={cn(
                          'text-xs uppercase tracking-wider mt-1 font-medium',
                          isCompleted
                            ? 'text-primary'
                            : isInProgress
                              ? 'text-blue-500'
                              : 'text-muted-foreground',
                        )}
                      >
                        {isCompleted ? 'Concluído' : isInProgress ? 'Em Andamento' : 'Pendente'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Progresso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mt-4">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={projectData.evolution}
                  margin={{ top: 5, right: 20, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-muted/50"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <ChartTooltip
                    cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 2 }}
                    content={<ChartTooltipContent />}
                  />
                  <Line
                    type="monotone"
                    dataKey="progress"
                    stroke="var(--color-progress)"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: 'var(--color-progress)',
                      strokeWidth: 2,
                      stroke: 'hsl(var(--background))',
                    }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-progress)' }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
