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
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Link } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { PrintDashboardReport } from '@/components/PrintDashboardReport'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [projects, setProjects] = useState<any[]>([])
  const [financials, setFinancials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [projs, fins] = await Promise.all([
        pb.collection('projects').getFullList(),
        pb.collection('financial_records').getFullList({ sort: 'date' }),
      ])
      setProjects(projs)
      setFinancials(fins)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('projects', () => loadData())
  useRealtime('financial_records', () => loadData())
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

      if (p.progress < 100 && p.end_date && new Date(p.end_date) < new Date()) {
        issues.push({
          project: p,
          type: 'deadline',
          message: `Prazo ultrapassado (${new Date(p.end_date).toLocaleDateString('pt-BR')})`,
        })
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
      .slice(-6) // Last 6 active months
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

  const activeProjectsCount = projects.filter((p) => p.status !== 'Concluído').length
  const completedProjectsCount = projects.filter((p) => p.status === 'Concluído').length

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Projetos</h2>
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
          <Button
            variant="outline"
            className="w-full md:w-auto shadow-sm"
            onClick={() => window.print()}
          >
            <Printer className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      <PrintDashboardReport
        projects={projects}
        financials={financials}
        bottlenecks={bottlenecks}
        userName={user?.name || user?.email || 'Administrador'}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-2">
        <Card className="shadow-sm border-muted/60">
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
        <Card className="shadow-sm border-muted/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Gargalo</CardTitle>
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
        <Card className="shadow-sm border-muted/60">
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
        <Card className="shadow-sm border-muted/60">
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

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7 mt-4">
        {/* Financial Metrics Chart */}
        <Card className="col-span-1 lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Métricas Financeiras</CardTitle>
            <CardDescription>Análise mensal de Receitas vs Despesas registradas.</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhum dado financeiro disponível.
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
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

        {/* Bottleneck Alerts System */}
        <Card className="col-span-1 lg:col-span-3 shadow-sm border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Gargalos e Alertas
            </CardTitle>
            <CardDescription>Projetos exigindo atenção imediata.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Analisando projetos...</div>
            ) : bottlenecks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mb-3 text-green-500/50" />
                <p>Nenhum gargalo detectado!</p>
                <p className="text-sm">Todos os projetos estão dentro do prazo e orçamento.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
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
                      ) : (
                        <Clock className="w-4 h-4 mr-1.5 text-orange-500 shrink-0" />
                      )}
                      <span
                        className={
                          b.type === 'budget'
                            ? 'text-destructive font-medium'
                            : 'text-orange-600 font-medium'
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
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="col-span-1 md:col-span-2 lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Progresso dos Projetos</CardTitle>
            <CardDescription>Acompanhamento detalhado do desenvolvimento.</CardDescription>
          </CardHeader>
          <CardContent>
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
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas atualizações da equipe de projetos.</CardDescription>
          </CardHeader>
          <CardContent>
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
      </div>
    </div>
  )
}

export default Dashboard
