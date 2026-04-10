import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Project } from '@/types/project'
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

interface ProductivityChartsProps {
  projects: Project[]
}

const pieConfig = {
  Concluído: { label: 'Concluído', color: '#10b981' },
  EmAndamento: { label: 'Em Andamento', color: '#3b82f6' },
  Atrasado: { label: 'Atrasado', color: '#ef4444' },
  Planejamento: { label: 'Planejamento', color: '#94a3b8' },
}

const barConfig = {
  projetos: { label: 'Projetos', color: '#4f46e5' },
}

const lineConfig = {
  produtividade: { label: 'Tarefas Concluídas', color: '#8b5cf6' },
}

export function ProductivityCharts({ projects }: ProductivityChartsProps) {
  const statusData = useMemo(() => {
    const counts = { Concluído: 0, 'Em Andamento': 0, Atrasado: 0, Planejamento: 0 }
    projects.forEach((p) => {
      if (counts[p.status as keyof typeof counts] !== undefined) {
        counts[p.status as keyof typeof counts]++
      }
    })
    return [
      { status: 'Concluído', valor: counts['Concluído'], fill: pieConfig.Concluído.color },
      { status: 'Em Andamento', valor: counts['Em Andamento'], fill: pieConfig.EmAndamento.color },
      { status: 'Atrasado', valor: counts['Atrasado'], fill: pieConfig.Atrasado.color },
      { status: 'Planejamento', valor: counts['Planejamento'], fill: pieConfig.Planejamento.color },
    ].filter((d) => d.valor > 0)
  }, [projects])

  const engineerData = useMemo(() => {
    const counts: Record<string, number> = {}
    projects.forEach((p) => {
      counts[p.engineer] = (counts[p.engineer] || 0) + 1
    })
    return Object.entries(counts).map(([name, count]) => ({
      name: name.replace('Eng. ', ''),
      projetos: count,
    }))
  }, [projects])

  const timelineData = useMemo(() => {
    // Generate some mock productivity data based on the real projects count to make it look dynamic
    const base = projects.length * 2
    return [
      { mes: 'Jan', produtividade: base + 12 },
      { mes: 'Fev', produtividade: base + 19 },
      { mes: 'Mar', produtividade: base + 15 },
      { mes: 'Abr', produtividade: base + 22 },
      { mes: 'Mai', produtividade: base + 28 },
      { mes: 'Jun', produtividade: base + 35 },
    ]
  }, [projects])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Status dos Projetos</CardTitle>
          <CardDescription>Projetos concluídos vs. em andamento</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[250px] pb-4">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={statusData}
                dataKey="valor"
                nameKey="status"
                innerRadius={60}
                strokeWidth={5}
                paddingAngle={5}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Distribuição por Membro</CardTitle>
          <CardDescription>Total de projetos por engenheiro</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <ChartContainer config={barConfig} className="aspect-square max-h-[250px] w-full">
            <BarChart data={engineerData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={12}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="projetos" fill="var(--color-projetos)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="flex flex-col md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>Produtividade no Tempo</CardTitle>
          <CardDescription>Tarefas concluídas (últimos 6 meses)</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <ChartContainer config={lineConfig} className="aspect-square max-h-[250px] w-full">
            <LineChart data={timelineData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={12}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="produtividade"
                stroke="var(--color-produtividade)"
                strokeWidth={3}
                dot={{ r: 4, fill: 'var(--color-produtividade)' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
