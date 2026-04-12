import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Activity, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Performance() {
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    try {
      const projs = await pb.collection('projects').getFullList()
      setProjects(projs)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('projects', () => loadData())

  const deadlineStats = useMemo(() => {
    let onTime = 0
    let delayed = 0
    let inProgressOnTime = 0
    let inProgressDelayed = 0

    const now = new Date()

    projects.forEach((p) => {
      if (!p.end_date) return
      const endDate = new Date(p.end_date)
      if (p.status === 'Concluído') {
        const updatedDate = new Date(p.updated)
        if (updatedDate <= endDate) onTime++
        else delayed++
      } else {
        if (now > endDate) inProgressDelayed++
        else inProgressOnTime++
      }
    })

    return [
      { name: 'Concluído no Prazo', value: onTime, color: 'hsl(var(--chart-2))' },
      { name: 'Concluído Atrasado', value: delayed, color: 'hsl(var(--destructive))' },
      { name: 'Em Andamento no Prazo', value: inProgressOnTime, color: 'hsl(var(--chart-1))' },
      { name: 'Em Andamento Atrasado', value: inProgressDelayed, color: 'hsl(var(--chart-3))' },
    ].filter((s) => s.value > 0)
  }, [projects])

  const engineerStats = useMemo(() => {
    const stats: Record<string, { total: number; completed: number; delayed: number }> = {}
    projects.forEach((p) => {
      const eng = p.engineer || 'Não atribuído'
      if (!stats[eng]) stats[eng] = { total: 0, completed: 0, delayed: 0 }
      stats[eng].total++
      if (p.status === 'Concluído') stats[eng].completed++
      if (p.end_date && new Date(p.end_date) < new Date() && p.status !== 'Concluído') {
        stats[eng].delayed++
      }
    })
    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        ...data,
        eficiencia: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.eficiencia - a.eficiencia)
  }, [projects])

  const generateMonthlySummary = () => {
    const lines = ['Relatório de Eficiência Mensal - Tozzi Engenharia']
    lines.push(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`)
    lines.push('')
    lines.push('--- STATUS DOS PROJETOS ---')
    deadlineStats.forEach((s) => lines.push(`${s.name},${s.value}`))
    lines.push('')
    lines.push('--- EFICIÊNCIA POR PROJETISTA ---')
    lines.push('Projetista,Total,Concluídos,Atrasados,Eficiência (%)')
    engineerStats.forEach((s) =>
      lines.push(`${s.name},${s.total},${s.completed},${s.delayed},${s.eficiencia}%`),
    )
    lines.push('')
    lines.push('--- DISTRIBUIÇÃO POR DISCIPLINA ---')
    lines.push('Disciplina,Total,Atrasados')
    disciplineStats.forEach((s) => lines.push(`${s.name},${s.total},${s.atrasados}`))

    const csvContent = lines.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `resumo_mensal_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const disciplineStats = useMemo(() => {
    const stats: Record<string, { total: number; delayed: number }> = {}
    projects.forEach((p) => {
      const disc = p.discipline || 'Outros'
      if (!stats[disc]) stats[disc] = { total: 0, delayed: 0 }
      stats[disc].total++
      if (p.end_date && new Date(p.end_date) < new Date() && p.status !== 'Concluído') {
        stats[disc].delayed++
      }
    })
    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        total: data.total,
        atrasados: data.delayed,
      }))
      .sort((a, b) => b.total - a.total)
  }, [projects])

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6 space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
            <Activity className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Performance
            </h1>
            <p className="text-muted-foreground">
              Métricas de eficiência, entregas no prazo e alocação de projetos.
            </p>
          </div>
        </div>
        <Button
          onClick={generateMonthlySummary}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Download className="h-4 w-4" />
          Gerar Resumo Mensal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {deadlineStats.length > 0 ? (
          deadlineStats.map((stat, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">projetos nesta situação</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-4 p-4 text-center text-muted-foreground border rounded-xl bg-card">
            {isLoading ? 'Carregando dados...' : 'Nenhum dado de prazo disponível.'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status de Prazos (Geral)</CardTitle>
            <CardDescription>Percentual de projetos no prazo vs atrasados</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[350px]">
            {deadlineStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deadlineStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {deadlineStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: any, name: any) => [`${value} projetos`, name]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground">Sem dados suficientes</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eficiência por Projetista</CardTitle>
            <CardDescription>Taxa de conclusão de projetos (%)</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {engineerStats.length > 0 ? (
              <ChartContainer
                config={{ eficiencia: { label: 'Eficiência (%)', color: 'hsl(var(--chart-2))' } }}
                className="h-full w-full"
              >
                <BarChart
                  data={engineerStats}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="eficiencia" fill="var(--color-eficiencia)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribuição por Disciplina</CardTitle>
            <CardDescription>Volume de projetos e atrasos ativos por disciplina</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {disciplineStats.length > 0 ? (
              <ChartContainer
                config={{
                  total: { label: 'Total de Projetos', color: 'hsl(var(--chart-1))' },
                  atrasados: { label: 'Em Atraso', color: 'hsl(var(--destructive))' },
                }}
                className="h-full w-full"
              >
                <BarChart
                  data={disciplineStats}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend verticalAlign="top" />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="atrasados" fill="var(--color-atrasados)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
